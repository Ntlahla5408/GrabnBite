using System.Security.Claims;
using GrabnBite.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Hubs
{
    [Authorize]
    public class TrackingHub : Hub
    {
        private readonly AppDbContext _context;

        public TrackingHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinOrderTracking(int orderId)
        {
            var userId = int.Parse(
                Context.User!.FindFirstValue(
                    ClaimTypes.NameIdentifier)!
            );

            var order = await _context.Orders
                .FirstOrDefaultAsync(o =>
                    o.OrderId == orderId);

            if (order == null)
            {
                throw new HubException(
                    "Order not found.");
            }

            // Customer can only track their own order
            if (Context.User.IsInRole("Customer"))
            {
                if (order.UserId != userId)
                {
                    throw new HubException(
                        "You cannot track this order.");
                }
            }

            // Restaurant can track its own orders
            if (Context.User.IsInRole("Restaurant"))
            {
                var restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r =>
                        r.RestaurantId == order.RestaurantId &&
                        r.UserId == userId);

                if (restaurant == null)
                {
                    throw new HubException(
                        "You cannot access this order.");
                }
            }

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"order-{orderId}");
        }

        public async Task LeaveOrderTracking(int orderId)
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                $"order-{orderId}");
        }
    }
}