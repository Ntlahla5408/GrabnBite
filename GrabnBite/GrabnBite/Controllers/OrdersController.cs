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
    [Authorize(Roles = "Customer")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<TrackingHub> _hubContext;

        public OrdersController(
            AppDbContext context,
            IHubContext<TrackingHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // ============================================================
        // HELPER - Get logged-in user ID from JWT
        // ============================================================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out var userId)
                ? userId
                : null;
        }

        // ============================================================
        // GET ONE ORDER
        // ============================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            if (id <= 0)
            {
                return BadRequest("A valid order id is required.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            return Ok(MapOrderToResponse(order));
        }

        // ============================================================
        // GET CUSTOMER'S ORDERS
        // ============================================================

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId.Value)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders
                .Select(MapOrderToResponse)
                .ToList();

            return Ok(response);
        }

        // ============================================================
        // CANCEL ORDER
        // ============================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            if (id <= 0)
            {
                return BadRequest("A valid order id is required.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var order = await _context.Orders
                .Include(o => o.StatusHistory)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId.Value);

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

            order.StatusHistory.Add(new OrderStatusHistory
            {
                Status = "CANCELLED",
                ChangedAt = DateTime.UtcNow,
                OrderId = order.OrderId
            });

            await _context.SaveChangesAsync();

            // Notify connected clients about the order status change.
            await _hubContext.Clients
                .User(userId.Value.ToString())
                .SendAsync(
                    "OrderStatusUpdated",
                    order.OrderId,
                    order.Status);

            return Ok(new
            {
                message = "Order cancelled successfully.",
                orderId = order.OrderId,
                status = order.Status
            });
        }

        // ============================================================
        // GET ORDER STATUS HISTORY
        // ============================================================

        [HttpGet("{id}/status-history")]
        public async Task<IActionResult> GetOrderStatusHistory(int id)
        {
            if (id <= 0)
            {
                return BadRequest("A valid order id is required.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var orderExists = await _context.Orders
                .AnyAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId.Value);

            if (!orderExists)
            {
                return NotFound("Order not found.");
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

        // ============================================================
        // MAP ORDER RESPONSE
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
                        MenuItemName = oi.ItemName,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Subtotal = oi.Subtotal
                    })
                    .ToList()
            };
        }
    }
}