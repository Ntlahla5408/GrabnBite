using GrabnBite.Data;
using GrabnBite.DTOs.Menu;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MenuItemController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuItemController(AppDbContext context)
        {
            _context = context;
        }

        // CREATE
        [HttpPost]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> CreateMenuItem(
            CreateMenuItemDto dto)
        {
            var restaurantExists = await _context.Restaurants
                .AnyAsync(r => r.RestaurantId == dto.RestaurantId);

            if (!restaurantExists)
            {
                return NotFound("Restaurant not found.");
            }

            var categoryExists = await _context.MenuCategories
                .AnyAsync(c =>
                    c.MenuCategoryId == dto.MenuCategoryId &&
                    c.RestaurantId == dto.RestaurantId);

            if (!categoryExists)
            {
                return BadRequest(
                    "The menu category does not belong to this restaurant.");
            }

            var menuItem = new MenuItem
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                IsAvailable = dto.IsAvailable,
                RestaurantId = dto.RestaurantId,
                MenuCategoryId = dto.MenuCategoryId
            };

            _context.MenuItems.Add(menuItem);

            await _context.SaveChangesAsync();

            var response = new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            };

            return CreatedAtAction(
                nameof(GetMenuItem),
                new { id = menuItem.MenuItemId },
                response);
        }

        // READ - Get all menu items
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetMenuItems()
        {
            var menuItems = await _context.MenuItems
                .ToListAsync();

            var response = menuItems.Select(m => new MenuItemResponseDto
            {
                MenuItemId = m.MenuItemId,
                Name = m.Name,
                Description = m.Description,
                Price = m.Price,
                IsAvailable = m.IsAvailable,
                RestaurantId = m.RestaurantId,
                MenuCategoryId = m.MenuCategoryId
            }).ToList();

            return Ok(response);
        }

        // READ - Get one menu item
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMenuItem(int id)
        {
            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemId == id);

            if (menuItem == null)
            {
                return NotFound("Menu item not found.");
            }

            var response = new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            };

            return Ok(response);
        }

        // READ - Get menu items for a restaurant
        [HttpGet("restaurant/{restaurantId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRestaurantMenu(int restaurantId)
        {
            var menuItems = await _context.MenuItems
                .Where(m => m.RestaurantId == restaurantId)
                .ToListAsync();

            var response = menuItems.Select(m => new MenuItemResponseDto
            {
                MenuItemId = m.MenuItemId,
                Name = m.Name,
                Description = m.Description,
                Price = m.Price,
                IsAvailable = m.IsAvailable,
                RestaurantId = m.RestaurantId,
                MenuCategoryId = m.MenuCategoryId
            }).ToList();

            return Ok(response);
        }

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> UpdateMenuItem(
            int id,
            UpdateMenuItemDto dto)
        {
            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemId == id);

            if (menuItem == null)
            {
                return NotFound("Menu item not found.");
            }

            menuItem.Name = dto.Name;
            menuItem.Description = dto.Description;
            menuItem.Price = dto.Price;
            menuItem.IsAvailable = dto.IsAvailable;

            await _context.SaveChangesAsync();

            var response = new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            };

            return Ok(response);
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> DeleteMenuItem(int id)
        {
            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemId == id);

            if (menuItem == null)
            {
                return NotFound("Menu item not found.");
            }

            _context.MenuItems.Remove(menuItem);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Menu item deleted successfully."
            });
        }
    }
}