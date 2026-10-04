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
        // GET ALL CURRENT USER CARTS
        // GET: api/Cart
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var carts = await _context.Carts
                .AsNoTracking()
                .Include(c => c.Restaurant)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.MenuItem)
                .Where(c => c.UserId == userId.Value)
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();

            if (carts.Count == 0)
            {
                return Ok(Array.Empty<CartResponseDto>());
            }

            var response = carts.Select(cart => new CartResponseDto
            {
                CartId = cart.CartId,
                RestaurantId = cart.RestaurantId,
                RestaurantName = cart.Restaurant.Name,

                Items = cart.CartItems.Select(ci =>
                    new CartItemResponseDto
                    {
                        CartItemId = ci.CartItemId,
                        MenuItemId = ci.MenuItemId,
                        MenuItemName = ci.MenuItem.Name,
                        Quantity = ci.Quantity,
                        UnitPrice = ci.UnitPrice,
                        Subtotal = ci.UnitPrice * ci.Quantity
                    }).ToList()
            }).ToList();

            foreach (var cartResponse in response)
            {
                cartResponse.TotalAmount =
                    cartResponse.Items.Sum(i => i.Subtotal);
            }

            return Ok(response);
        }

        // ============================================================
        // ADD ITEM
        // POST: api/Cart/items
        // ============================================================

        [HttpPost("items")]
        public async Task<IActionResult> AddItem(
            [FromBody] AddCartItemDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest("Cart item data is required.");
            }

            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    "Quantity must be greater than zero.");
            }

            var menuItem = await _context.MenuItems
                .Include(m => m.Restaurant)
                .FirstOrDefaultAsync(m =>
                    m.MenuItemId == dto.MenuItemId);

            if (menuItem == null)
            {
                return NotFound("Menu item not found.");
            }

            if (!menuItem.IsAvailable)
            {
                return BadRequest(
                    "This menu item is currently unavailable.");
            }

            if (!menuItem.Restaurant.IsOpen)
            {
                return BadRequest(
                    "This restaurant is currently closed.");
            }

            if (!menuItem.Restaurant.IsApproved)
            {
                return BadRequest(
                    "This restaurant is not approved.");
            }

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c =>
                    c.UserId == userId.Value &&
                    c.RestaurantId == menuItem.RestaurantId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId.Value,
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

        // ============================================================
        // UPDATE ITEM
        // PUT: api/Cart/items/{id}
        // ============================================================

        [HttpPut("items/{id:int}")]
        public async Task<IActionResult> UpdateItem(
            int id,
            [FromBody] UpdateCartItemDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest("Cart item data is required.");
            }

            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    "Quantity must be greater than zero.");
            }

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci =>
                    ci.CartItemId == id &&
                    ci.Cart.UserId == userId.Value);

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

        // ============================================================
        // REMOVE ITEM
        // DELETE: api/Cart/items/{id}
        // ============================================================

        [HttpDelete("items/{id:int}")]
        public async Task<IActionResult> RemoveItem(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci =>
                    ci.CartItemId == id &&
                    ci.Cart.UserId == userId.Value);

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

        // ============================================================
        // CLEAR ALL CURRENT USER CARTS
        // DELETE: api/Cart
        // ============================================================

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var carts = await _context.Carts
                .Include(c => c.CartItems)
                .Where(c => c.UserId == userId.Value)
                .ToListAsync();

            if (carts.Count == 0)
            {
                return NotFound("Cart not found.");
            }

            foreach (var cart in carts)
            {
                _context.CartItems.RemoveRange(cart.CartItems);
                cart.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cart cleared successfully."
            });
        }
    }
}