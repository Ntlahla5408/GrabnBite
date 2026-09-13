using GrabnBite.Data;
using GrabnBite.DTOs.Menu;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuItemController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuItemController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CREATE
        // =========================================================
        [HttpPost("restaurant/{restaurantId}")]
        public async Task<IActionResult> CreateMenuItem(
            int restaurantId,
            CreateMenuItemDto dto)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Menu item name is required.");
            }

            if (dto.Price < 0)
            {
                return BadRequest("Price cannot be negative.");
            }

            if (dto.MenuCategoryId <= 0)
            {
                return BadRequest("A valid menu category is required.");
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (!restaurant.IsApproved)
            {
                return BadRequest(
                    "This restaurant has not been approved yet.");
            }

            var categoryExists = await _context.MenuCategories
                .AnyAsync(c =>
                    c.MenuCategoryId == dto.MenuCategoryId &&
                    c.RestaurantId == restaurantId);

            if (!categoryExists)
            {
                return BadRequest(
                    "The menu category does not belong to this restaurant.");
            }

            var menuItem = new MenuItem
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                IsAvailable = dto.IsAvailable,
                RestaurantId = restaurantId,
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

        // =========================================================
        // READ - Get all menu items
        // =========================================================
        [HttpGet]
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

        // =========================================================
        // READ - Get one menu item
        // =========================================================
        [HttpGet("{id}")]
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

        // =========================================================
        // READ - Get menu items for a restaurant
        // =========================================================
        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantMenu(int restaurantId)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            var restaurantExists = await _context.Restaurants
                .AnyAsync(r => r.RestaurantId == restaurantId);

            if (!restaurantExists)
            {
                return NotFound("Restaurant not found.");
            }

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

        // =========================================================
        // UPDATE
        // =========================================================
        [HttpPut("restaurant/{restaurantId}/{id}")]
        public async Task<IActionResult> UpdateMenuItem(
            int restaurantId,
            int id,
            UpdateMenuItemDto dto)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            if (id <= 0)
            {
                return BadRequest("A valid menu item id is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Menu item name is required.");
            }

            if (dto.Price < 0)
            {
                return BadRequest("Price cannot be negative.");
            }

            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(m =>
                    m.MenuItemId == id &&
                    m.RestaurantId == restaurantId);

            if (menuItem == null)
            {
                return NotFound(
                    "Menu item not found for this restaurant.");
            }

            menuItem.Name = dto.Name.Trim();
            menuItem.Description = dto.Description?.Trim();
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

        // =========================================================
        // DELETE
        // =========================================================
        [HttpDelete("restaurant/{restaurantId}/{id}")]
        public async Task<IActionResult> DeleteMenuItem(
            int restaurantId,
            int id)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            if (id <= 0)
            {
                return BadRequest("A valid menu item id is required.");
            }

            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(m =>
                    m.MenuItemId == id &&
                    m.RestaurantId == restaurantId);

            if (menuItem == null)
            {
                return NotFound(
                    "Menu item not found for this restaurant.");
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