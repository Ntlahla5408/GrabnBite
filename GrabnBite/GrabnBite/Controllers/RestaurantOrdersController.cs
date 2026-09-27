using GrabnBite.Data;
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
    [Authorize(Roles = "Restaurant")]
    public class RestaurantOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<TrackingHub> _hubContext;

        public RestaurantOrdersController(
            AppDbContext context,
            IHubContext<TrackingHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // ============================================================
        // HELPER - Get logged-in restaurant user ID
        // ============================================================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out var userId)
                ? userId
                : null;
        }

        // ============================================================
        // HELPER - Get restaurant owned by logged-in user
        // ============================================================

        private async Task<Restaurant?> GetCurrentRestaurant()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return null;

            return await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.UserId == userId.Value);
        }

        // ============================================================
        // GET RESTAURANT ORDERS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            var restaurant = await GetCurrentRestaurant();

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurant profile not found.");
            }

            var orders = await _context.Orders
                .Where(o =>
                    o.RestaurantId == restaurant.RestaurantId)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var response = orders.Select(o => new
            {
                orderId = o.OrderId,
                orderDate = o.OrderDate,
                status = o.Status,
                totalAmount = o.TotalAmount,
                userId = o.UserId,
                deliveryAddressId = o.DeliveryAddressId,

                items = o.OrderItems.Select(item => new
                {
                    orderItemId = item.OrderItemId,
                    menuItemId = item.MenuItemId,
                    menuItemName = item.ItemName,
                    quantity = item.Quantity,
                    unitPrice = item.UnitPrice,
                    subtotal = item.Subtotal
                }),

                statusHistory = o.StatusHistory
                    .OrderBy(h => h.ChangedAt)
                    .Select(h => new
                    {
                        status = h.Status,
                        changedAt = h.ChangedAt
                    })
            });

            return Ok(response);
        }

        // ============================================================
        // ACCEPT ORDER
        // ============================================================

        [HttpPatch("{orderId}/accept")]
        public async Task<IActionResult> AcceptOrder(int orderId)
        {
            return await ChangeOrderStatus(
                orderId,
                "PENDING",
                "ACCEPTED",
                "Order accepted successfully.");
        }

        // ============================================================
        // START PREPARING
        // ============================================================

        [HttpPatch("{orderId}/prepare")]
        public async Task<IActionResult> StartPreparing(int orderId)
        {
            return await ChangeOrderStatus(
                orderId,
                "ACCEPTED",
                "PREPARING",
                "Order is now being prepared.");
        }

        // ============================================================
        // MARK ORDER READY
        // ============================================================

        [HttpPatch("{orderId}/ready")]
        public async Task<IActionResult> MarkReady(int orderId)
        {
            return await ChangeOrderStatus(
                orderId,
                "PREPARING",
                "READY",
                "Order is ready for pickup.");
        }

        // ============================================================
        // CHANGE ORDER STATUS
        // ============================================================

        private async Task<IActionResult> ChangeOrderStatus(
     int orderId,
     string expectedStatus,
     string newStatus,
     string message)
        {
            if (orderId <= 0)
            {
                return BadRequest(
                    "A valid order id is required.");
            }

            var restaurant = await GetCurrentRestaurant();

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurant profile not found.");
            }

            var order = await _context.Orders
                .Include(o => o.StatusHistory)
                .Include(o => o.Delivery)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == orderId &&
                    o.RestaurantId == restaurant.RestaurantId);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (order.Status != expectedStatus)
            {
                return BadRequest(
                    $"Order must be {expectedStatus} before it can become {newStatus}.");
            }

            // Change order status
            order.Status = newStatus;

            // Add status history
            order.StatusHistory.Add(
                new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    Status = newStatus,
                    ChangedAt = DateTime.UtcNow
                });

            // ============================================================
            // CREATE DELIVERY WHEN ORDER BECOMES READY
            // ============================================================

            if (newStatus == "READY")
            {
                // Prevent duplicate delivery records
                if (order.Delivery == null)
                {
                    order.Delivery = new Delivery
                    {
                        OrderId = order.OrderId,
                        DriverId = null,
                        Status = "UNASSIGNED"
                    };
                }
            }

            await _context.SaveChangesAsync();

            // Notify the customer that the order status changed.
            await _hubContext.Clients
                .User(order.UserId.ToString())
                .SendAsync(
                    "OrderStatusUpdated",
                    order.OrderId,
                    order.Status);

            return Ok(new
            {
                message,
                orderId = order.OrderId,
                status = order.Status,
                deliveryCreated = newStatus == "READY"
            });
        }
    }
}