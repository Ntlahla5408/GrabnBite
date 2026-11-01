using GrabnBite.Data;
using GrabnBite.DTOs.Menu;
using GrabnBite.Models.Entities;
using GrabnBite.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuItemController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICloudinaryImageService _cloudinary;
        private readonly ILogger<MenuItemController> _logger;

        public MenuItemController(
            AppDbContext context,
            ICloudinaryImageService cloudinary,
            ILogger<MenuItemController> logger)
        {
            _context = context;
            _cloudinary = cloudinary;
            _logger = logger;
        }

        // =========================================================
        // HELPER - Get logged-in user ID from JWT
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out var userId)
                ? userId
                : null;
        }

        // =========================================================
        // CREATE
        // Restaurant can create for own restaurant
        // Admin can create for any restaurant
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
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

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            // Restaurant users can only manage their own restaurant.
            if (User.IsInRole("Restaurant") &&
                restaurant.UserId != currentUserId.Value)
            {
                return Forbid();
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
                Description = dto.Description?.Trim() ?? string.Empty,
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
                Description = menuItem.Description ?? string.Empty,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                ImageUrl = menuItem.ImageUrl,
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
        // Public
        // =========================================================
        [AllowAnonymous]
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
                ImageUrl = m.ImageUrl,
                RestaurantId = m.RestaurantId,
                MenuCategoryId = m.MenuCategoryId
            }).ToList();

            return Ok(response);
        }

        // =========================================================
        // READ - Get one menu item
        // Public
        // =========================================================
        [AllowAnonymous]
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
                Description = menuItem.Description ?? string.Empty,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                ImageUrl = menuItem.ImageUrl,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            };

            return Ok(response);
        }

        // =========================================================
        // READ - Get menu items for a restaurant
        // Public
        // =========================================================
        [AllowAnonymous]
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
                ImageUrl = m.ImageUrl,
                RestaurantId = m.RestaurantId,
                MenuCategoryId = m.MenuCategoryId
            }).ToList();

            return Ok(response);
        }

        // =========================================================
        // UPDATE
        // Restaurant can update own restaurant
        // Admin can update any restaurant
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
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

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            // Restaurant users can only update their own restaurant.
            if (User.IsInRole("Restaurant") &&
                restaurant.UserId != currentUserId.Value)
            {
                return Forbid();
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
            menuItem.Description = dto.Description?.Trim() ?? string.Empty;
            menuItem.Price = dto.Price;
            menuItem.IsAvailable = dto.IsAvailable;

            await _context.SaveChangesAsync();

            var response = new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description ?? string.Empty,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                ImageUrl = menuItem.ImageUrl,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            };

            return Ok(response);
        }


        // =========================================================
        // UPLOAD / REPLACE MENU ITEM IMAGE
        // Restaurant owner or Admin
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
        [HttpPost("restaurant/{restaurantId}/{id}/image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadMenuItemImage(
            int restaurantId,
            int id,
            [FromForm] IFormFile? image,
            CancellationToken cancellationToken)
        {
            if (restaurantId <= 0 || id <= 0)
            {
                return BadRequest("Valid restaurant and menu item ids are required.");
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId, cancellationToken);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (User.IsInRole("Restaurant") && restaurant.UserId != currentUserId.Value)
            {
                return Forbid();
            }

            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(item =>
                    item.MenuItemId == id && item.RestaurantId == restaurantId,
                    cancellationToken);

            if (menuItem == null)
            {
                return NotFound("Menu item not found for this restaurant.");
            }

            var validationError = await ImageUploadValidation.ValidateAsync(
                image, cancellationToken);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var oldPublicId = menuItem.ImagePublicId;
            CloudinaryUploadResult uploaded;

            await using (var stream = image!.OpenReadStream())
            {
                uploaded = await _cloudinary.UploadImageAsync(
                    stream,
                    $"menu-item-{id}-{Guid.NewGuid():N}",
                    $"restaurants/{restaurantId}/menu-items/{id}",
                    cancellationToken);
            }

            menuItem.ImageUrl = uploaded.SecureUrl;
            menuItem.ImagePublicId = uploaded.PublicId;

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                try
                {
                    await _cloudinary.DeleteImageAsync(uploaded.PublicId, cancellationToken);
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(cleanupException,
                        "Could not clean up newly uploaded menu item image {PublicId}.",
                        uploaded.PublicId);
                }

                throw;
            }

            if (!string.IsNullOrWhiteSpace(oldPublicId))
            {
                try
                {
                    await _cloudinary.DeleteImageAsync(oldPublicId, cancellationToken);
                }
                catch (Exception deleteException)
                {
                    _logger.LogWarning(deleteException,
                        "Menu item image {PublicId} was replaced in the database but could not be deleted from Cloudinary.",
                        oldPublicId);
                }
            }

            return Ok(new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                ImageUrl = menuItem.ImageUrl,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            });
        }

        // =========================================================
        // REMOVE MENU ITEM IMAGE
        // Restaurant owner or Admin
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
        [HttpDelete("restaurant/{restaurantId}/{id}/image")]
        public async Task<IActionResult> DeleteMenuItemImage(
            int restaurantId,
            int id,
            CancellationToken cancellationToken)
        {
            if (restaurantId <= 0 || id <= 0)
            {
                return BadRequest("Valid restaurant and menu item ids are required.");
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId, cancellationToken);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (User.IsInRole("Restaurant") && restaurant.UserId != currentUserId.Value)
            {
                return Forbid();
            }

            var menuItem = await _context.MenuItems
                .FirstOrDefaultAsync(item =>
                    item.MenuItemId == id && item.RestaurantId == restaurantId,
                    cancellationToken);

            if (menuItem == null)
            {
                return NotFound("Menu item not found for this restaurant.");
            }

            var oldPublicId = menuItem.ImagePublicId;
            menuItem.ImageUrl = null;
            menuItem.ImagePublicId = null;

            await _context.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(oldPublicId))
            {
                try
                {
                    await _cloudinary.DeleteImageAsync(oldPublicId, cancellationToken);
                }
                catch (Exception deleteException)
                {
                    _logger.LogWarning(deleteException,
                        "Menu item image {PublicId} was removed from the menu but could not be deleted from Cloudinary.",
                        oldPublicId);
                }
            }

            return Ok(new MenuItemResponseDto
            {
                MenuItemId = menuItem.MenuItemId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                IsAvailable = menuItem.IsAvailable,
                ImageUrl = menuItem.ImageUrl,
                RestaurantId = menuItem.RestaurantId,
                MenuCategoryId = menuItem.MenuCategoryId
            });
        }

        // =========================================================
        // DELETE
        // Restaurant can delete own restaurant's item
        // Admin can delete any restaurant's item
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
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

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == restaurantId);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            // Restaurant users can only delete from their own restaurant.
            if (User.IsInRole("Restaurant") &&
                restaurant.UserId != currentUserId.Value)
            {
                return Forbid();
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

            var imagePublicId = menuItem.ImagePublicId;
            _context.MenuItems.Remove(menuItem);

            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(imagePublicId))
            {
                try
                {
                    await _cloudinary.DeleteImageAsync(imagePublicId);
                }
                catch (Exception deleteException)
                {
                    _logger.LogWarning(deleteException,
                        "Menu item {MenuItemId} was deleted but its Cloudinary image {PublicId} could not be removed.",
                        id,
                        imagePublicId);
                }
            }

            return Ok(new
            {
                message = "Menu item deleted successfully."
            });
        }
    }
}