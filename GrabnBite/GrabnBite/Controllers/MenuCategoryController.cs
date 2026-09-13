using GrabnBite.Data;
using GrabnBite.DTOs.Menu;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuCategoryController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // CREATE CATEGORY
        // ============================================================

        [HttpPost("restaurant/{restaurantId}")]
        public async Task<IActionResult> CreateCategory(
            int restaurantId,
            CreateMenuCategoryDto dto)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Category name is required.");
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (!restaurant.IsApproved)
            {
                return BadRequest(
                    "This restaurant has not been approved yet.");
            }

            var category = new MenuCategory
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                RestaurantId = restaurant.RestaurantId
            };

            _context.MenuCategories.Add(category);

            await _context.SaveChangesAsync();

            var response = new MenuCategoryResponseDto
            {
                MenuCategoryId = category.MenuCategoryId,
                Name = category.Name,
                Description = category.Description,
                RestaurantId = category.RestaurantId
            };

            return CreatedAtAction(
                nameof(GetCategory),
                new { id = category.MenuCategoryId },
                response);
        }

        // ============================================================
        // GET ALL CATEGORIES
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.MenuCategories
                .ToListAsync();

            var response = categories
                .Select(c => new MenuCategoryResponseDto
                {
                    MenuCategoryId = c.MenuCategoryId,
                    Name = c.Name,
                    Description = c.Description,
                    RestaurantId = c.RestaurantId
                })
                .ToList();

            return Ok(response);
        }

        // ============================================================
        // GET ONE CATEGORY
        // ============================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c =>
                    c.MenuCategoryId == id);

            if (category == null)
            {
                return NotFound("Menu category not found.");
            }

            var response = new MenuCategoryResponseDto
            {
                MenuCategoryId = category.MenuCategoryId,
                Name = category.Name,
                Description = category.Description,
                RestaurantId = category.RestaurantId
            };

            return Ok(response);
        }

        // ============================================================
        // UPDATE CATEGORY
        // ============================================================

        [HttpPut("restaurant/{restaurantId}/{id}")]
        public async Task<IActionResult> UpdateCategory(
            int restaurantId,
            int id,
            UpdateMenuCategoryDto dto)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Category name is required.");
            }

            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c =>
                    c.MenuCategoryId == id &&
                    c.RestaurantId == restaurantId);

            if (category == null)
            {
                return NotFound(
                    "Menu category not found for this restaurant.");
            }

            category.Name = dto.Name.Trim();
            category.Description = dto.Description?.Trim();

            await _context.SaveChangesAsync();

            var response = new MenuCategoryResponseDto
            {
                MenuCategoryId = category.MenuCategoryId,
                Name = category.Name,
                Description = category.Description,
                RestaurantId = category.RestaurantId
            };

            return Ok(response);
        }

        // ============================================================
        // DELETE CATEGORY
        // ============================================================

        [HttpDelete("restaurant/{restaurantId}/{id}")]
        public async Task<IActionResult> DeleteCategory(
            int restaurantId,
            int id)
        {
            if (restaurantId <= 0)
            {
                return BadRequest("A valid restaurantId is required.");
            }

            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c =>
                    c.MenuCategoryId == id &&
                    c.RestaurantId == restaurantId);

            if (category == null)
            {
                return NotFound(
                    "Menu category not found for this restaurant.");
            }

            _context.MenuCategories.Remove(category);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Menu category deleted successfully."
            });
        }
    }
}