using Npgsql;
using GrabnBite.Data;
using GrabnBite.DTOs.Checkout;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Customer")]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;

    public CheckoutController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }

        // ============================================================
        // CHECKOUT CART
        // POST: /api/Checkout
        // Customer only
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Checkout(
            [FromBody] CreateCheckoutDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest("Checkout data is required.");
            }

            if (dto.CartId <= 0)
            {
                return BadRequest("Invalid cart ID.");
            }

            if (dto.DeliveryAddressId <= 0)
            {
                return BadRequest("Invalid delivery address ID.");
            }

            var paymentMethod = dto.PaymentMethod?.Trim().ToUpperInvariant();
            if (paymentMethod != "YOCO" && paymentMethod != "CASH")
            {
                return BadRequest("Invalid payment method. Choose YOCO or CASH.");
            }

            // Prevent two concurrent checkout requests from creating two orders
            // from the same cart. This transaction also keeps order creation and
            // cart clearing atomic.
            await using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            // --------------------------------------------------------
            // Find the authenticated customer's cart
            // --------------------------------------------------------

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.MenuItem)
                .Include(c => c.Restaurant)
                .FirstOrDefaultAsync(c =>
                    c.CartId == dto.CartId &&
                    c.UserId == userId.Value);

            if (cart == null)
            {
                return BadRequest("Cart not found.");
            }

            if (!cart.CartItems.Any())
            {
                return BadRequest("Your cart is empty.");
            }

            // --------------------------------------------------------
            // Validate restaurant
            // --------------------------------------------------------

            if (cart.Restaurant == null)
            {
                return BadRequest(
                    "The restaurant associated with this cart was not found.");
            }

            if (!cart.Restaurant.IsApproved)
            {
                return BadRequest(
                    "This restaurant is not currently approved.");
            }

            if (!cart.Restaurant.IsOpen)
            {
                return BadRequest(
                    "This restaurant is currently closed.");
            }

            // --------------------------------------------------------
            // Validate delivery address
            // --------------------------------------------------------

            var address = await _context.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == dto.DeliveryAddressId &&
                    a.UserId == userId.Value);

            if (address == null)
            {
                return BadRequest(
                    "The delivery address does not belong to this user.");
            }

            // --------------------------------------------------------
            // Re-check menu items
            // --------------------------------------------------------

            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.MenuItem == null)
                {
                    return BadRequest(
                        "A menu item in the cart could not be found.");
                }

                if (!cartItem.MenuItem.IsAvailable)
                {
                    return BadRequest(
                        $"The menu item '{cartItem.MenuItem.Name}' is no longer available.");
                }

                if (cartItem.MenuItem.RestaurantId != cart.RestaurantId)
                {
                    return BadRequest(
                        "A cart item belongs to a different restaurant.");
                }

                if (cartItem.Quantity <= 0)
                {
                    return BadRequest(
                        "Cart contains an invalid quantity.");
                }

                if (cartItem.MenuItem.Price < 0)
                {
                    return BadRequest(
                        "A menu item has an invalid price.");
                }
            }

            // --------------------------------------------------------
            // Reuse an unresolved Yoco order for the same unchanged cart.
            // This prevents duplicate orders when a customer returns to checkout
            // after leaving or cancelling the provider page.
            // --------------------------------------------------------

            if (paymentMethod == "YOCO")
            {
                var matchingPendingOrder = await _context.Orders
                    .Include(o => o.Payment)
                    .Include(o => o.OrderItems)
                    .Where(o => o.UserId == userId.Value &&
                                o.RestaurantId == cart.RestaurantId &&
                                o.Status == "PENDING" &&
                                o.Payment != null &&
                                o.Payment.PaymentMethod == "YOCO" &&
                                (o.Payment.PaymentStatus == "PENDING" ||
                                 o.Payment.PaymentStatus == "INITIATED" ||
                                 o.Payment.PaymentStatus == "FAILED") &&
                                !o.Payment.RequiresReconciliation &&
                                o.Payment.RefundStatus == "NOT_REQUIRED")
                    .OrderByDescending(o => o.OrderDate)
                    .FirstOrDefaultAsync();

                if (matchingPendingOrder != null)
                {
                    var currentCartSnapshot = cart.CartItems
                        .OrderBy(item => item.MenuItemId)
                        .Select(item => new { item.MenuItemId, item.Quantity })
                        .ToList();

                    var pendingOrderSnapshot = matchingPendingOrder.OrderItems
                        .OrderBy(item => item.MenuItemId)
                        .Select(item => new { item.MenuItemId, item.Quantity })
                        .ToList();

                    var snapshotsMatch =
                        currentCartSnapshot.Count == pendingOrderSnapshot.Count &&
                        currentCartSnapshot.Zip(pendingOrderSnapshot)
                            .All(pair =>
                                pair.First.MenuItemId == pair.Second.MenuItemId &&
                                pair.First.Quantity == pair.Second.Quantity);

                    if (snapshotsMatch)
                    {
                        await transaction.CommitAsync();

                        return Ok(new
                        {
                            message = "Resuming your existing pending Yoco order.",
                            orderId = matchingPendingOrder.OrderId,
                            userId = matchingPendingOrder.UserId,
                            restaurantId = matchingPendingOrder.RestaurantId,
                            deliveryAddressId = matchingPendingOrder.DeliveryAddressId,
                            totalAmount = matchingPendingOrder.TotalAmount,
                            status = matchingPendingOrder.Status
                        });
                    }
                }
            }

            // --------------------------------------------------------
            // Create order
            // --------------------------------------------------------

            var order = new Order
            {
                UserId = userId.Value,
                RestaurantId = cart.RestaurantId,
                DeliveryAddressId = dto.DeliveryAddressId,
                // Older address records may have a missing/blank label even though
                // the Orders snapshot column is required by PostgreSQL.
                DeliveryAddressLabel = string.IsNullOrWhiteSpace(address.Label)
                    ? "Delivery address"
                    : address.Label.Trim(),
                DeliveryStreetAddress = address.StreetAddress,
                DeliveryCity = address.City,
                DeliveryProvince = address.Province,
                DeliveryPostalCode = address.PostalCode,
                DeliveryLatitude = address.Latitude,
                DeliveryLongitude = address.Longitude,
                Status = "PENDING",
                OrderDate = DateTime.UtcNow
            };

            // --------------------------------------------------------
            // Add initial status history
            // --------------------------------------------------------

            order.StatusHistory.Add(new OrderStatusHistory
            {
                Status = "PENDING",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId.Value,
                ChangedByRole = User.FindFirstValue(ClaimTypes.Role) ?? "Customer"
            });

            // --------------------------------------------------------
            // Copy cart items into order items
            // --------------------------------------------------------

            foreach (var cartItem in cart.CartItems)
            {
                var orderItem = new OrderItem
                {
                    MenuItemId = cartItem.MenuItemId,
                    ItemName = cartItem.MenuItem.Name,
                    Quantity = cartItem.Quantity,
                    // Use the current menu price at checkout, not a stale
                    // cart price captured before a restaurant changed its menu.
                    UnitPrice = cartItem.MenuItem.Price,
                    Subtotal =
                        cartItem.MenuItem.Price * cartItem.Quantity
                };

                order.OrderItems.Add(orderItem);
            }

            // --------------------------------------------------------
            // Calculate total
            // --------------------------------------------------------

            order.TotalAmount = order.OrderItems
                .Sum(item => item.Subtotal);

            if (order.TotalAmount <= 0)
            {
                return BadRequest(
                    "The order total must be greater than zero.");
            }

            // Create the payment record in the same transaction as the order.
            // This guarantees that restaurant visibility can distinguish cash
            // orders from unpaid Yoco orders without a race between API calls.
            order.Payment = new Payment
            {
                Amount = order.TotalAmount,
                PaymentStatus = "PENDING",
                PaymentMethod = paymentMethod!,
                PaymentReference = $"GNB-PAY-{Guid.NewGuid():N}".Substring(0, 16).ToUpperInvariant(),
                PaymentDate = DateTime.UtcNow
            };

            // --------------------------------------------------------
            // Save order
            // --------------------------------------------------------

            _context.Orders.Add(order);

            // CASH orders retain their existing behaviour. For Yoco, keep the
            // cart until the provider independently confirms successful payment.
            if (paymentMethod == "CASH")
            {
                _context.CartItems.RemoveRange(cart.CartItems);
            }

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex) when (
                ex is DbUpdateException ||
                ex.GetType().Name == "SerializationFailureException" ||
                ex is PostgresException postgresException &&
                    postgresException.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                await transaction.RollbackAsync();
                return Conflict("The cart changed while checkout was being processed. Refresh your cart before trying again.");
            }

            // --------------------------------------------------------
            // Return result
            // --------------------------------------------------------

            return Ok(new
            {
                message = "Checkout successful.",
                orderId = order.OrderId,
                userId = order.UserId,
                restaurantId = order.RestaurantId,
                deliveryAddressId = order.DeliveryAddressId,
                totalAmount = order.TotalAmount,
                status = order.Status
            });
        }
    }
}
