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
    public class MenuCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuCategoryController(AppDbContext context)
        {
            _context = context;
        }

        // CREATE
        [HttpPost]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> CreateCategory(
            CreateMenuCategoryDto dto)
        {
            var restaurantExists = await _context.Restaurants
                .AnyAsync(r => r.RestaurantId == dto.RestaurantId);

            if (!restaurantExists)
            {
                return NotFound("Restaurant not found.");
            }

            var category = new MenuCategory
            {
                Name = dto.Name,
                Description = dto.Description,
                RestaurantId = dto.RestaurantId
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

        // READ - Get all categories
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.MenuCategories
                .ToListAsync();

            var response = categories.Select(c => new MenuCategoryResponseDto
            {
                MenuCategoryId = c.MenuCategoryId,
                Name = c.Name,
                Description = c.Description,
                RestaurantId = c.RestaurantId
            }).ToList();

            return Ok(response);
        }

        // READ - Get one category
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c => c.MenuCategoryId == id);

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

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> UpdateCategory(
            int id,
            UpdateMenuCategoryDto dto)
        {
            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c => c.MenuCategoryId == id);

            if (category == null)
            {
                return NotFound("Menu category not found.");
            }

            category.Name = dto.Name;
            category.Description = dto.Description;

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

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.MenuCategories
                .FirstOrDefaultAsync(c => c.MenuCategoryId == id);

            if (category == null)
            {
                return NotFound("Menu category not found.");
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