using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.DTOs.Checkout;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // ============================================================
        // CHECKOUT CART
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Checkout(
            CreateCheckoutDto dto)
        {
            var userId = GetCurrentUserId();

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

            if (!cart.CartItems.Any())
            {
                return BadRequest("Your cart is empty.");
            }

            // --------------------------------------------------------
            // Validate restaurant
            // --------------------------------------------------------

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
                    "The delivery address does not belong to the current user.");
            }

            // --------------------------------------------------------
            // Re-check menu items
            // --------------------------------------------------------

            foreach (var cartItem in cart.CartItems)
            {
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

                    // Historical snapshot
                    ItemName = cartItem.MenuItem.Name,

                    Quantity = cartItem.Quantity,

                    // Price stored when item was added to cart
                    UnitPrice = cartItem.UnitPrice,

                    Subtotal = cartItem.UnitPrice * cartItem.Quantity
                };

                order.OrderItems.Add(orderItem);
            }

            // --------------------------------------------------------
            // Calculate total
            // --------------------------------------------------------

            order.TotalAmount = order.OrderItems
                .Sum(item => item.Subtotal);

            // --------------------------------------------------------
            // Save order
            // --------------------------------------------------------

            _context.Orders.Add(order);

            // --------------------------------------------------------
            // Clear cart
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
                restaurantId = order.RestaurantId,
                deliveryAddressId = order.DeliveryAddressId,
                totalAmount = order.TotalAmount,
                status = order.Status
            });
        }
    }
}