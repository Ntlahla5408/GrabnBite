using GrabnBite.Data;
using GrabnBite.DTOs.Restaurant;
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
    public class RestaurantController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICloudinaryImageService _cloudinary;
        private readonly ILogger<RestaurantController> _logger;

        public RestaurantController(
            AppDbContext context,
            ICloudinaryImageService cloudinary,
            ILogger<RestaurantController> logger)
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
        // Restaurant only
        // =========================================================

        [Authorize(Roles = "Restaurant")]
        [HttpPost]
        [Obsolete("Restaurant profiles are created only after an application is approved.")]
        public IActionResult CreateRestaurant(CreateRestaurantDto dto)
        {
            // Do not allow the legacy endpoint to bypass partner verification.
            // A RestaurantApplication is created during account registration.
            return Conflict(new
            {
                message = "Direct restaurant creation is disabled. Complete your restaurant partner application and wait for approval."
            });
        }

        // =========================================================
        // READ - Get all restaurants
        // Public
        // =========================================================

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetRestaurants()
        {
            var restaurants = await _context.Restaurants
                .Include(r => r.RestaurantApplication)
                .Where(r => r.IsApproved && r.IsActive)
                .ToListAsync();

            var response = restaurants
                .Select(MapRestaurantToResponse)
                .ToList();

            return Ok(response);
        }

        // =========================================================
        // READ - Get one restaurant
        // Public
        // =========================================================

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRestaurant(int id)
        {
            if (id <= 0)
            {
                return BadRequest(
                    "A valid restaurant id is required.");
            }

            var restaurant = await _context.Restaurants
                .Include(r => r.RestaurantApplication)
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.IsApproved &&
                    r.IsActive);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        // UPDATE OWN RESTAURANT
        // Restaurant only
        // =========================================================

        [Authorize(Roles = "Restaurant")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRestaurant(
            int id,
            UpdateRestaurantDto dto)
        {
            if (id <= 0)
            {
                return BadRequest(
                    "A valid restaurant id is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Restaurant name is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                return BadRequest("Phone number is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Address))
            {
                return BadRequest("Address is required.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            // Restaurant must belong to logged-in user
            var restaurant = await _context.Restaurants
                .Include(r => r.RestaurantApplication)
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.UserId == userId.Value);

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurant not found for this user.");
            }

            restaurant.Name = dto.Name.Trim();
            restaurant.Description = dto.Description?.Trim() ?? string.Empty;
            restaurant.PhoneNumber = dto.PhoneNumber.Trim();
            restaurant.Email = dto.Email.Trim();
            restaurant.Address = dto.Address.Trim();
            restaurant.ImageUrl = dto.ImageUrl?.Trim();
            restaurant.Latitude = dto.Latitude;
            restaurant.Longitude = dto.Longitude;
            restaurant.IsOpen = dto.IsOpen;

            // IsApproved is intentionally NOT changed here.
            // Only the admin should approve a restaurant.

            await _context.SaveChangesAsync();

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        // ADMIN UPDATE
        // Admin only
        // =========================================================

        [Authorize(Roles = "Admin")]
        [HttpPut("admin/{id}")]
        public async Task<IActionResult> UpdateRestaurantAsAdmin(
            int id,
            UpdateRestaurantDto dto)
        {
            if (id <= 0)
            {
                return BadRequest(
                    "A valid restaurant id is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Restaurant name is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                return BadRequest("Phone number is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Address))
            {
                return BadRequest("Address is required.");
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            restaurant.Name = dto.Name.Trim();
            restaurant.Description = dto.Description?.Trim() ?? string.Empty;
            restaurant.PhoneNumber = dto.PhoneNumber.Trim();
            restaurant.Email = dto.Email.Trim();
            restaurant.Address = dto.Address.Trim();
            restaurant.ImageUrl = dto.ImageUrl?.Trim();
            restaurant.Latitude = dto.Latitude;
            restaurant.Longitude = dto.Longitude;
            restaurant.IsOpen = dto.IsOpen;

            await _context.SaveChangesAsync();

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        // UPDATE RESTAURANT APPROVAL
        // Admin only
        // =========================================================
        [Authorize(Roles = "Admin")]
        [HttpPut("admin/{id}/approval")]
        public async Task<IActionResult> UpdateRestaurantApproval(
            int id,
            UpdateRestaurantApprovalDto dto)
        {
            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == id);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            restaurant.IsApproved = dto.IsApproved;

            // Approval is deliberately separate from editing restaurant details.
            // Opening a restaurant remains a separate operational decision.
            await _context.SaveChangesAsync();

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        // DELETE OWN RESTAURANT
        // Restaurant only
        // =========================================================

        [Authorize(Roles = "Restaurant")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRestaurant(int id)
        {
            if (id <= 0)
            {
                return BadRequest(
                    "A valid restaurant id is required.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            // Restaurant must belong to logged-in user
            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.UserId == userId.Value);

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurant not found for this user.");
            }

            _context.Restaurants.Remove(restaurant);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Restaurant deleted successfully."
            });
        }


        // =========================================================
        // UPLOAD / REPLACE RESTAURANT PROFILE IMAGE
        // Restaurant owner or Admin
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
        [HttpPost("{id}/image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadRestaurantImage(
            int id,
            [FromForm] IFormFile? image,
            CancellationToken cancellationToken)
        {
            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == id, cancellationToken);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (User.IsInRole("Restaurant") && restaurant.UserId != userId.Value)
            {
                return Forbid();
            }

            var validationError = await ImageUploadValidation.ValidateAsync(
                image, cancellationToken);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var oldPublicId = restaurant.ImagePublicId;
            CloudinaryUploadResult uploaded;

            await using (var stream = image!.OpenReadStream())
            {
                uploaded = await _cloudinary.UploadImageAsync(
                    stream,
                    $"restaurant-{id}-{Guid.NewGuid():N}{GetImageExtension(image!.ContentType)}",
                    image!.ContentType,
                    $"restaurants/{id}",
                    cancellationToken);
            }

            restaurant.ImageUrl = uploaded.SecureUrl;
            restaurant.ImagePublicId = uploaded.PublicId;

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
                        "Could not clean up newly uploaded restaurant image {PublicId}.",
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
                        "Restaurant image {PublicId} was replaced in the database but could not be deleted from Cloudinary.",
                        oldPublicId);
                }
            }

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        // REMOVE RESTAURANT PROFILE IMAGE
        // Restaurant owner or Admin
        // =========================================================
        [Authorize(Roles = "Restaurant,Admin")]
        [HttpDelete("{id}/image")]
        public async Task<IActionResult> DeleteRestaurantImage(
            int id,
            CancellationToken cancellationToken)
        {
            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.RestaurantId == id, cancellationToken);

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            if (User.IsInRole("Restaurant") && restaurant.UserId != userId.Value)
            {
                return Forbid();
            }

            var oldPublicId = restaurant.ImagePublicId;
            restaurant.ImageUrl = null;
            restaurant.ImagePublicId = null;

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
                        "Restaurant image {PublicId} was removed from the profile but could not be deleted from Cloudinary.",
                        oldPublicId);
                }
            }

            return Ok(MapRestaurantToResponse(restaurant));
        }

        // =========================================================
        private static string GetImageExtension(string contentType)
        {
            return contentType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };
        }

        // =========================================================
        // MAP RESTAURANT RESPONSE
        // =========================================================

        private RestaurantResponseDto MapRestaurantToResponse(
            Restaurant restaurant)
        {
            return new RestaurantResponseDto
            {
                RestaurantId = restaurant.RestaurantId,
                Name = restaurant.Name,
                Description = restaurant.Description ?? string.Empty,
                PhoneNumber = restaurant.PhoneNumber,
                Email = restaurant.Email,
                Address = restaurant.Address,
                Location = restaurant.RestaurantApplication?.City,
                ImageUrl = restaurant.ImageUrl,
                Latitude = restaurant.Latitude,
                Longitude = restaurant.Longitude,
                IsOpen = restaurant.IsOpen,
                IsApproved = restaurant.IsApproved,
                AveragePreparationTimeMinutes = restaurant.RestaurantApplication?.AveragePreparationTimeMinutes,
                CreatedAt = restaurant.CreatedAt
            };
        }

        // =========================================================
        // READ - Get logged-in restaurant
        // Restaurant only
        // =========================================================
        [Authorize(Roles = "Restaurant")]
        [HttpGet("my-restaurants")]
        public async Task<IActionResult> GetMyRestaurants()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var restaurants = await _context.Restaurants
                .Where(r => r.UserId == userId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    restaurantId = r.RestaurantId,
                    name = r.Name,
                    description = r.Description,
                    phoneNumber = r.PhoneNumber,
                    email = r.Email,
                    address = r.Address,
                    imageUrl = r.ImageUrl,
                    latitude = r.Latitude,
                    longitude = r.Longitude,
                    isOpen = r.IsOpen,
                    isApproved = r.IsApproved,
                    isActive = r.IsActive,
                    restaurantApplicationId = r.RestaurantApplicationId,
                    createdAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(restaurants);
        }

        // Backwards-compatible endpoint for clients that still expect one profile.
        // It returns a conflict when an account owns multiple restaurants so that
        // the client cannot silently select an arbitrary profile.
        [Authorize(Roles = "Restaurant")]
        [HttpGet("my-restaurant")]
        public async Task<IActionResult> GetMyRestaurant()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var restaurants = await _context.Restaurants
                .Where(r =>
                    r.UserId == userId.Value &&
                    r.IsApproved &&
                    r.IsActive)
                .OrderByDescending(r => r.CreatedAt)
                .Take(2)
                .ToListAsync();

            if (restaurants.Count == 0)
            {
                return NotFound("No operational restaurant profile found for this account. Complete a partner application first.");
            }

            if (restaurants.Count > 1)
            {
                return Conflict(new
                {
                    message = "This account has multiple restaurant profiles. Use GET api/Restaurant/my-restaurants and select a restaurant.",
                    profilesEndpoint = "/api/Restaurant/my-restaurants"
                });
            }

            return Ok(MapRestaurantToResponse(restaurants[0]));
        }
    }
}