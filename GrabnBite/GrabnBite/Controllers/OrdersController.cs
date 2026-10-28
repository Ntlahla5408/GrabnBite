using GrabnBite.Data;
using GrabnBite.DTOs.Order;
using GrabnBite.Hubs;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Data;

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

            // Use a serializable transaction so cancellation and payment-state
            // checks cannot silently pass each other under concurrent requests.
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var order = await _context.Orders
                .Include(o => o.StatusHistory)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == id &&
                    o.UserId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (order.Status != "PENDING")
            {
                return BadRequest("Only pending orders can be cancelled.");
            }

            // Cancellation is safe only if no payment exists or the provider has
            // authoritatively confirmed that the payment failed. PENDING/INITIATED
            // outcomes are ambiguous; PAID requires the refund workflow.
            if (order.Payment != null)
            {
                var paymentIsPaid = string.Equals(
                    order.Payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase);
                var isCashOnDelivery = string.Equals(
                    order.Payment.PaymentMethod, "CASH", StringComparison.OrdinalIgnoreCase);
                var paymentIsUnresolved = !string.Equals(
                    order.Payment.PaymentStatus, "FAILED", StringComparison.OrdinalIgnoreCase);

                // Cash-on-delivery has no external payment to reconcile before
                // collection. It may be cancelled while the order is still pending,
                // but a recorded PAID result must still go through refund handling.
                if (paymentIsPaid || (!isCashOnDelivery && paymentIsUnresolved))
                {
                    return Conflict(paymentIsPaid
                        ? "This order has been paid. Cancellation must be handled through the refund process."
                        : "Payment is still pending or has not been reconciled. Check the payment status before cancelling.");
                }
            }

            order.Status = "CANCELLED";
            order.StatusHistory.Add(new OrderStatusHistory
            {
                Status = "CANCELLED",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId.Value,
                ChangedByRole = User.FindFirstValue(ClaimTypes.Role) ?? "Customer",
                OrderId = order.OrderId
            });

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex) when (ex is DbUpdateException || ex.GetType().Name == "SerializationFailureException" ||
                                       ex.GetType().Name == "PostgresException")
            {
                await transaction.RollbackAsync();
                // A payment confirmation or another cancellation may have won the race.
                // Ask the client to refresh rather than reporting a false success.
                return Conflict("The order or payment changed while cancellation was being processed. Refresh and check the latest status.");
            }

            // Notify connected clients only after the database transaction commits.
            await _hubContext.Clients
                .User(userId.Value.ToString())
                .SendAsync("OrderStatusUpdated", order.OrderId, order.Status);

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
                    h.ChangedAt,
                    h.ChangedByUserId,
                    h.ChangedByRole
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