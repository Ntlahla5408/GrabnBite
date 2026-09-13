using GrabnBite.Data;
using GrabnBite.DTOs.Order;
using GrabnBite.Hubs;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
        // GET ONE ORDER
        // ============================================================

        [HttpGet("{userId}/{id}")]
        public async Task<IActionResult> GetOrder(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            return Ok(MapOrderToResponse(order));
        }

        // ============================================================
        // GET CUSTOMER'S ORDERS
        // ============================================================

        [HttpGet("{userId}/my-orders")]
        public async Task<IActionResult> GetMyOrders(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

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
        // CANCEL ORDER
        // ============================================================

        [HttpDelete("{userId}/{id}")]
        public async Task<IActionResult> CancelOrder(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var order = await _context.Orders
                .FirstOrDefaultAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId);

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
                ChangedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

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

        [HttpGet("{userId}/{id}/status-history")]
        public async Task<IActionResult> GetOrderStatusHistory(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var orderExists = await _context.Orders
                .AnyAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId);

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