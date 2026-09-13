using GrabnBite.Data;
using GrabnBite.DTOs.Checkout;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CheckoutController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // CHECKOUT CART
        // POST: /api/Checkout/{userId}
        // ============================================================

        [HttpPost("{userId:int}")]
        public async Task<IActionResult> Checkout(
            int userId,
            CreateCheckoutDto dto)
        {
            // --------------------------------------------------------
            // Validate user ID
            // --------------------------------------------------------

            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
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

            // --------------------------------------------------------
            // Find customer's cart
            // --------------------------------------------------------

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.MenuItem)
                .Include(c => c.Restaurant)
                .FirstOrDefaultAsync(c =>
                    c.CartId == dto.CartId &&
                    c.UserId == userId);

            if (cart == null)
            {
                return BadRequest("Cart not found.");
            }

            // --------------------------------------------------------
            // Check cart
            // --------------------------------------------------------

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
                    a.UserId == userId);

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

                if (cartItem.UnitPrice < 0)
                {
                    return BadRequest(
                        "Cart contains an invalid item price.");
                }
            }

            // --------------------------------------------------------
            // Create order
            // --------------------------------------------------------

            var order = new Order
            {
                UserId = userId,
                RestaurantId = cart.RestaurantId,
                DeliveryAddressId = dto.DeliveryAddressId,
                Status = "PENDING",
                OrderDate = DateTime.UtcNow
            };

            // --------------------------------------------------------
            // Add initial order status history
            // --------------------------------------------------------

            order.StatusHistory.Add(new OrderStatusHistory
            {
                Status = "PENDING",
                ChangedAt = DateTime.UtcNow
            });

            // --------------------------------------------------------
            // Copy cart items into order items
            // --------------------------------------------------------

            foreach (var cartItem in cart.CartItems)
            {
                var orderItem = new OrderItem
                {
                    MenuItemId = cartItem.MenuItemId,

                    // Historical snapshot of the item name
                    ItemName = cartItem.MenuItem.Name,

                    Quantity = cartItem.Quantity,

                    // Use the price stored in the cart
                    UnitPrice = cartItem.UnitPrice,

                    Subtotal =
                        cartItem.UnitPrice * cartItem.Quantity
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

            // --------------------------------------------------------
            // Save order
            // --------------------------------------------------------

            _context.Orders.Add(order);

            // --------------------------------------------------------
            // Clear cart after creating order
            // --------------------------------------------------------

            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();

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