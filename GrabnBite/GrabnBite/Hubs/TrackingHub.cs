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
            var userIdValue = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId))
            {
                throw new HubException("Your account could not be identified.");
            }

            if (orderId <= 0)
            {
                throw new HubException("A valid order id is required.");
            }

            var user = Context.User!;
            var isAdmin = user.IsInRole("Admin");
            var isCustomer = user.IsInRole("Customer");
            var isRestaurant = user.IsInRole("Restaurant");
            var isDriver = user.IsInRole("Driver");

            // Do not grant group access to authenticated users with an unknown role.
            if (!isAdmin && !isCustomer && !isRestaurant && !isDriver)
            {
                throw new HubException("Your account is not authorised to track orders.");
            }

            var order = await _context.Orders
                .AsNoTracking()
                .Where(o => o.OrderId == orderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.UserId,
                    o.RestaurantId,
                    IsOwnedRestaurant = _context.Restaurants.Any(r =>
                        r.RestaurantId == o.RestaurantId && r.UserId == userId),
                    IsAssignedDriver = _context.Deliveries.Any(d =>
                        d.OrderId == o.OrderId &&
                        d.Driver != null &&
                        d.Driver.UserId == userId)
                })
                .FirstOrDefaultAsync();

            if (order == null)
            {
                throw new HubException("Order not found.");
            }

            // Admins can monitor orders. All other roles must have a direct
            // relationship with the order they are attempting to track.
            var isAuthorised =
                isAdmin ||
                (isCustomer && order.UserId == userId) ||
                (isRestaurant && order.IsOwnedRestaurant) ||
                (isDriver && order.IsAssignedDriver);

            if (!isAuthorised)
            {
                throw new HubException("You cannot track this order.");
            }

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"order-{orderId}");
        }

        public async Task LeaveOrderTracking(int orderId)
        {
            if (orderId <= 0)
            {
                return;
            }

            // Leaving a group only removes this connection's own subscription.
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                $"order-{orderId}");
        }
    }
}