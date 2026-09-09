using GrabnBite.Data;
using GrabnBite.DTOs.Order;
using GrabnBite.Hubs;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<TrackingHub> _hubContext;

        public OrderController(
            AppDbContext context,
            IHubContext<TrackingHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // ============================================================
        // HELPER - GET CURRENT USER ID
        // ============================================================

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // ============================================================
        // CREATE ORDER
        // Customer places an order
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateOrder(CreateOrderDto dto)
        {
            var userId = GetCurrentUserId();

            if (dto.OrderItems == null || !dto.OrderItems.Any())
            {
                return BadRequest("An order must contain at least one item.");
            }

            // Prevent duplicate menu items
            if (dto.OrderItems
                .GroupBy(i => i.MenuItemId)
                .Any(g => g.Count() > 1))
            {
                return BadRequest(
                    "The same menu item cannot appear more than once in an order.");
            }

            // Validate quantities
            if (dto.OrderItems.Any(i => i.Quantity <= 0))
            {
                return BadRequest(
                    "All item quantities must be greater than zero.");
            }

            // --------------------------------------------------------
            // Find restaurant
            // --------------------------------------------------------

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == dto.RestaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (!restaurant.IsApproved)
            {
                return BadRequest("This restaurant is not approved.");
            }

            if (!restaurant.IsOpen)
            {
                return BadRequest("This restaurant is currently closed.");
            }

            // --------------------------------------------------------
            // Validate delivery address belongs to customer
            // --------------------------------------------------------

            var addressExists = await _context.Addresses
                .AnyAsync(a =>
                    a.AddressId == dto.DeliveryAddressId &&
                    a.UserId == userId);

            if (!addressExists)
            {
                return BadRequest(
                    "The delivery address does not belong to the current user.");
            }

            // --------------------------------------------------------
            // Get menu items
            // --------------------------------------------------------

            var menuItemIds = dto.OrderItems
                .Select(i => i.MenuItemId)
                .ToList();

            var menuItems = await _context.MenuItems
                .Where(m =>
                    menuItemIds.Contains(m.MenuItemId) &&
                    m.RestaurantId == dto.RestaurantId &&
                    m.IsAvailable)
                .ToListAsync();

            if (menuItems.Count != menuItemIds.Count)
            {
                return BadRequest(
                    "One or more menu items are invalid, unavailable, or belong to another restaurant.");
            }

            // --------------------------------------------------------
            // Create order
            // --------------------------------------------------------

            var order = new Order
            {
                UserId = userId,
                RestaurantId = dto.RestaurantId,
                DeliveryAddressId = dto.DeliveryAddressId,
                Status = "PENDING",
                OrderDate = DateTime.UtcNow
            };

            foreach (var itemDto in dto.OrderItems)
            {
                var menuItem = menuItems
                    .First(m => m.MenuItemId == itemDto.MenuItemId);

                var subtotal = menuItem.Price * itemDto.Quantity;

                var orderItem = new OrderItem
                {
                    MenuItemId = menuItem.MenuItemId,

                    // Snapshot of item name
                    ItemName = menuItem.Name,

                    Quantity = itemDto.Quantity,

                    // Snapshot of price
                    UnitPrice = menuItem.Price,

                    Subtotal = subtotal
                };

                order.OrderItems.Add(orderItem);
            }

            order.TotalAmount = order.OrderItems
                .Sum(i => i.Subtotal);

            _context.Orders.Add(order);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOrder),
                new { id = order.OrderId },
                new
                {
                    message = "Order created successfully.",
                    orderId = order.OrderId,
                    totalAmount = order.TotalAmount,
                    status = order.Status
                });
        }

        // ============================================================
        // GET ONE ORDER
        // Customer can only see own order
        // Restaurant can see orders belonging to its restaurant
        // Admin can see any order
        // ============================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            var userId = GetCurrentUserId();

            // Admin can view everything
            if (User.IsInRole("Admin"))
            {
                return Ok(MapOrderToResponse(order));
            }

            // Customer can only view own order
            if (User.IsInRole("Customer"))
            {
                if (order.UserId != userId)
                {
                    return Forbid();
                }

                return Ok(MapOrderToResponse(order));
            }

            // Restaurant can only view its own restaurant orders
            if (User.IsInRole("Restaurant"))
            {
                var restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r =>
                        r.RestaurantId == order.RestaurantId &&
                        r.UserId == userId);

                if (restaurant == null)
                {
                    return Forbid();
                }

                return Ok(MapOrderToResponse(order));
            }

            return Forbid();
        }

        // ============================================================
        // GET CUSTOMER'S ORDERS
        // ============================================================

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();

            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders
                .Select(MapOrderToResponse)
                .ToList();

            return Ok(response);
        }

        // ============================================================
        // GET RESTAURANT ORDERS
        // Restaurant user can only see their own restaurant orders
        // Admin can see any restaurant
        // ============================================================

        [HttpGet("restaurant/{restaurantId}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> GetRestaurantOrders(
            int restaurantId)
        {
            var userId = GetCurrentUserId();

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            // Restaurant users can only access their own restaurant
            if (User.IsInRole("Restaurant") &&
                restaurant.UserId != userId)
            {
                return Forbid();
            }

            var orders = await _context.Orders
                .Where(o => o.RestaurantId == restaurantId)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders
                .Select(MapOrderToResponse)
                .ToList();

            return Ok(response);
        }

        // ============================================================
        // RESTAURANT UPDATES ORDER STATUS
        // ============================================================

        [HttpPut("{id}/restaurant-status")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> UpdateRestaurantOrderStatus(
            int id,
            UpdateOrderStatusDto dto)
        {
            var userId = GetCurrentUserId();

            var order = await _context.Orders
                .Include(o => o.Restaurant)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // Restaurant can only update orders belonging to its restaurant
            if (User.IsInRole("Restaurant") &&
                order.Restaurant.UserId != userId)
            {
                return Forbid();
            }

            var validRestaurantStatuses = new[]
            {
                "ACCEPTED",
                "PREPARING",
                "READY_FOR_PICKUP"
            };

            if (!validRestaurantStatuses.Contains(dto.Status))
            {
                return BadRequest(
                    "Restaurant can only set status to ACCEPTED, PREPARING, or READY_FOR_PICKUP.");
            }

            // Enforce correct sequence
            var validTransition = order.Status switch
            {
                "PENDING" when dto.Status == "ACCEPTED" => true,

                "ACCEPTED" when dto.Status == "PREPARING" => true,

                "PREPARING" when dto.Status == "READY_FOR_PICKUP" => true,

                _ => false
            };

            // Admin can override the normal transition rules
            if (!validTransition && !User.IsInRole("Admin"))
            {
                return BadRequest(
                    $"Cannot change order status from {order.Status} to {dto.Status}.");
            }

            order.Status = dto.Status;

            order.StatusHistory.Add(new OrderStatusHistory
            {
                Status = dto.Status,
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            await _hubContext.Clients
    .Group($"order-{order.OrderId}")
    .SendAsync(
        "OrderStatusUpdated",
        new
        {
            orderId = order.OrderId,
            status = order.Status,
            updatedAt = DateTime.UtcNow
        });

            return Ok(new
            {
                message = "Order status updated successfully.",
                orderId = order.OrderId,
                status = order.Status
            });
        }

        // ============================================================
        // CANCEL ORDER
        // Customer can only cancel own pending order
        // ============================================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = GetCurrentUserId();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // Make sure customer owns the order
            if (order.UserId != userId)
            {
                return Forbid();
            }

            if (order.Status != "PENDING")
            {
                return BadRequest(
                    "Only pending orders can be cancelled.");
            }

            order.Status = "CANCELLED";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order cancelled successfully.",
                orderId = order.OrderId,
                status = order.Status
            });
        }

        // ============================================================
        // MAP ORDER TO RESPONSE DTO
        // ============================================================

        private OrderResponseDto MapOrderToResponse(Order order)
        {
            return new OrderResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                UserId = order.UserId,
                RestaurantId = order.RestaurantId,
                DeliveryAddressId = order.DeliveryAddressId,

                OrderItems = order.OrderItems
                    .Select(oi => new OrderItemResponseDto
                    {
                        OrderItemId = oi.OrderItemId,
                        MenuItemId = oi.MenuItemId,

                        // Use historical snapshot
                        MenuItemName = oi.ItemName,

                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Subtotal = oi.Subtotal
                    })
                    .ToList()
            };
        }

        [HttpGet("{id}/status-history")]
        public async Task<IActionResult> GetOrderStatusHistory(int id)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            var userId = GetCurrentUserId();

            // Customer can only see their own order
            if (User.IsInRole("Customer") &&
                order.UserId != userId)
            {
                return Forbid();
            }

            // Restaurant can only see its own restaurant's order
            if (User.IsInRole("Restaurant"))
            {
                var restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r =>
                        r.RestaurantId == order.RestaurantId &&
                        r.UserId == userId);

                if (restaurant == null)
                {
                    return Forbid();
                }
            }

            var history = await _context.OrderStatusHistories
                .Where(h => h.OrderId == id)
                .OrderBy(h => h.ChangedAt)
                .Select(h => new
                {
                    h.OrderStatusHistoryId,
                    h.Status,
                    h.ChangedAt
                })
                .ToListAsync();

            return Ok(history);
        }
    }
}