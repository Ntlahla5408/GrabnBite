using GrabnBite.Data;
using GrabnBite.DTOs.Cart;
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
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // GET: api/cart
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetCurrentUserId();

            var cart = await _context.Carts
                .Include(c => c.Restaurant)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.MenuItem)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return Ok(new
                {
                    message = "Cart is empty.",
                    items = new List<CartItemResponseDto>(),
                    totalAmount = 0
                });
            }

            var response = new CartResponseDto
            {
                CartId = cart.CartId,
                RestaurantId = cart.RestaurantId,
                RestaurantName = cart.Restaurant.Name,
                Items = cart.CartItems.Select(ci => new CartItemResponseDto
                {
                    CartItemId = ci.CartItemId,
                    MenuItemId = ci.MenuItemId,
                    MenuItemName = ci.MenuItem.Name,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.UnitPrice,
                    Subtotal = ci.UnitPrice * ci.Quantity
                }).ToList()
            };

            response.TotalAmount = response.Items
                .Sum(i => i.Subtotal);

            return Ok(response);
        }

        // POST: api/cart/items
        [HttpPost("items")]
        public async Task<IActionResult> AddItem(
            AddCartItemDto dto)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest("Quantity must be greater than zero.");
            }

            var userId = GetCurrentUserId();

            var menuItem = await _context.MenuItems
                .Include(m => m.Restaurant)
                .FirstOrDefaultAsync(m => m.MenuItemId == dto.MenuItemId);

            if (menuItem == null)
            {
                return NotFound("Menu item not found.");
            }

            if (!menuItem.IsAvailable)
            {
                return BadRequest("This menu item is currently unavailable.");
            }

            if (!menuItem.Restaurant.IsOpen)
            {
                return BadRequest("This restaurant is currently closed.");
            }

            if (!menuItem.Restaurant.IsApproved)
            {
                return BadRequest("This restaurant is not approved.");
            }

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c =>
                    c.UserId == userId &&
                    c.RestaurantId == menuItem.RestaurantId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    RestaurantId = menuItem.RestaurantId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Carts.Add(cart);

                await _context.SaveChangesAsync();
            }

            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci =>
                    ci.CartId == cart.CartId &&
                    ci.MenuItemId == dto.MenuItemId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                existingItem.UnitPrice = menuItem.Price;
            }
            else
            {
                var cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    MenuItemId = menuItem.MenuItemId,
                    Quantity = dto.Quantity,
                    UnitPrice = menuItem.Price
                };

                _context.CartItems.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Item added to cart successfully."
            });
        }

        // PUT: api/cart/items/{id}
        [HttpPut("items/{id}")]
        public async Task<IActionResult> UpdateItem(
            int id,
            UpdateCartItemDto dto)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    "Quantity must be greater than zero.");
            }

            var userId = GetCurrentUserId();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci =>
                    ci.CartItemId == id &&
                    ci.Cart.UserId == userId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            cartItem.Quantity = dto.Quantity;
            cartItem.Cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cart item updated successfully."
            });
        }

        // DELETE: api/cart/items/{id}
        [HttpDelete("items/{id}")]
        public async Task<IActionResult> RemoveItem(int id)
        {
            var userId = GetCurrentUserId();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci =>
                    ci.CartItemId == id &&
                    ci.Cart.UserId == userId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            cartItem.Cart.UpdatedAt = DateTime.UtcNow;

            _context.CartItems.Remove(cartItem);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Item removed from cart successfully."
            });
        }

        // DELETE: api/cart
        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetCurrentUserId();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            _context.CartItems.RemoveRange(cart.CartItems);

            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cart cleared successfully."
            });
        }
    }
}