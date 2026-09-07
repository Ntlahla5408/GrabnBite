using GrabnBite.Data;
using GrabnBite.DTOs.Order;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        // CREATE - Customer places an order
        [HttpPost]
        public async Task<IActionResult> CreateOrder(CreateOrderDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("User ID could not be determined.");
            }

            if (dto.OrderItems == null || !dto.OrderItems.Any())
            {
                return BadRequest("An order must contain at least one item.");
            }

            var restaurantExists = await _context.Restaurants
                .AnyAsync(r => r.RestaurantId == dto.RestaurantId);

            if (!restaurantExists)
            {
                return NotFound("Restaurant not found.");
            }

            var addressExists = await _context.Addresses
                .AnyAsync(a => a.AddressId == dto.DeliveryAddressId
                            && a.UserId == userId);

            if (!addressExists)
            {
                return BadRequest("The delivery address does not belong to the current user.");
            }

            var menuItemIds = dto.OrderItems
                .Select(i => i.MenuItemId)
                .ToList();

            var menuItems = await _context.MenuItems
                .Where(m => menuItemIds.Contains(m.MenuItemId)
                         && m.RestaurantId == dto.RestaurantId
                         && m.IsAvailable)
                .ToListAsync();

            if (menuItems.Count != menuItemIds.Distinct().Count())
            {
                return BadRequest(
                    "One or more menu items are invalid, unavailable, or belong to another restaurant.");
            }

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

                if (itemDto.Quantity <= 0)
                {
                    return BadRequest("Quantity must be greater than zero.");
                }

                var orderItem = new OrderItem
                {
                    MenuItemId = menuItem.MenuItemId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = menuItem.Price,
                    Subtotal = menuItem.Price * itemDto.Quantity
                };

                order.OrderItems.Add(orderItem);
            }

            order.TotalAmount = order.OrderItems.Sum(i => i.Subtotal);

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

        // READ - Get one order
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            var response = new OrderResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                UserId = order.UserId,
                RestaurantId = order.RestaurantId,
                DeliveryAddressId = order.DeliveryAddressId,

                OrderItems = order.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    OrderItemId = oi.OrderItemId,
                    MenuItemId = oi.MenuItemId,
                    MenuItemName = oi.MenuItem.Name,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    Subtotal = oi.Subtotal
                }).ToList()
            };

            return Ok(response);
        }

        // READ - Customer's orders
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("User ID could not be determined.");
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders.Select(order => new OrderResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                UserId = order.UserId,
                RestaurantId = order.RestaurantId,
                DeliveryAddressId = order.DeliveryAddressId,

                OrderItems = order.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    OrderItemId = oi.OrderItemId,
                    MenuItemId = oi.MenuItemId,
                    MenuItemName = oi.MenuItem.Name,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    Subtotal = oi.Subtotal
                }).ToList()
            });

            return Ok(response);
        }

        // READ - Restaurant's orders
        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantOrders(int restaurantId)
        {
            var orders = await _context.Orders
                .Where(o => o.RestaurantId == restaurantId)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders.Select(order => new OrderResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                UserId = order.UserId,
                RestaurantId = order.RestaurantId,
                DeliveryAddressId = order.DeliveryAddressId,

                OrderItems = order.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    OrderItemId = oi.OrderItemId,
                    MenuItemId = oi.MenuItemId,
                    MenuItemName = oi.MenuItem.Name,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    Subtotal = oi.Subtotal
                }).ToList()
            });

            return Ok(response);
        }

        // UPDATE - Update order status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(
            int id,
            UpdateOrderStatusDto dto)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            var validStatuses = new[]
            {
                "PENDING",
                "ACCEPTED",
                "PREPARING",
                "READY_FOR_PICKUP",
                "DRIVER_PICKED_UP",
                "DELIVERING",
                "DELIVERED",
                "CANCELLED"
            };

            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest("Invalid order status.");
            }

            order.Status = dto.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order status updated successfully.",
                orderId = order.OrderId,
                status = order.Status
            });
        }

        // DELETE/CANCEL - Cancel an order
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
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
    }
}
