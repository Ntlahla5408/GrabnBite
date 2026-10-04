using GrabnBite.Data;
using GrabnBite.DTOs.Restaurant;
using GrabnBite.Models.Entities;
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

        public RestaurantController(AppDbContext context)
        {
            _context = context;
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
        public async Task<IActionResult> CreateRestaurant(
            CreateRestaurantDto dto)
        {
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

            // Prevent one user account from creating multiple restaurants
            var existingRestaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.UserId == userId.Value);

            if (existingRestaurant != null)
            {
                return BadRequest(
                    "This account already has a restaurant.");
            }

            var restaurant = new Restaurant
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = dto.Email.Trim(),
                Address = dto.Address.Trim(),
                ImageUrl = dto.ImageUrl?.Trim(),
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,

                // Taken from JWT, NOT from frontend
                UserId = userId.Value,

                IsOpen = false,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Restaurants.Add(restaurant);

            await _context.SaveChangesAsync();

            var response = new RestaurantResponseDto
            {
                RestaurantId = restaurant.RestaurantId,
                Name = restaurant.Name,
                Description = restaurant.Description,
                PhoneNumber = restaurant.PhoneNumber,
                Email = restaurant.Email,
                Address = restaurant.Address,
                ImageUrl = restaurant.ImageUrl,
                Latitude = restaurant.Latitude,
                Longitude = restaurant.Longitude,
                IsOpen = restaurant.IsOpen,
                IsApproved = restaurant.IsApproved,
                CreatedAt = restaurant.CreatedAt
            };

            return CreatedAtAction(
                nameof(GetRestaurant),
                new { id = restaurant.RestaurantId },
                response);
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
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id);

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
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.UserId == userId.Value);

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurant not found for this user.");
            }

            restaurant.Name = dto.Name.Trim();
            restaurant.Description = dto.Description?.Trim();
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
            restaurant.Description = dto.Description?.Trim();
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
        // MAP RESTAURANT RESPONSE
        // =========================================================

        private RestaurantResponseDto MapRestaurantToResponse(
            Restaurant restaurant)
        {
            return new RestaurantResponseDto
            {
                RestaurantId = restaurant.RestaurantId,
                Name = restaurant.Name,
                Description = restaurant.Description,
                PhoneNumber = restaurant.PhoneNumber,
                Email = restaurant.Email,
                Address = restaurant.Address,
                ImageUrl = restaurant.ImageUrl,
                Latitude = restaurant.Latitude,
                Longitude = restaurant.Longitude,
                IsOpen = restaurant.IsOpen,
                IsApproved = restaurant.IsApproved,
                CreatedAt = restaurant.CreatedAt
            };
        }

        // =========================================================
        // READ - Get logged-in restaurant
        // Restaurant only
        // =========================================================
        [Authorize(Roles = "Restaurant")]
        [HttpGet("my-restaurant")]
        public async Task<IActionResult> GetMyRestaurant()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.UserId == userId.Value);

            if (restaurant == null)
            {
                return NotFound("No restaurant profile found for this account.");
            }

            return Ok(new
            {
                restaurantId = restaurant.RestaurantId,
                name = restaurant.Name,
                description = restaurant.Description,
                phoneNumber = restaurant.PhoneNumber,
                email = restaurant.Email,
                address = restaurant.Address,
                imageUrl = restaurant.ImageUrl,
                latitude = restaurant.Latitude,
                longitude = restaurant.Longitude,
                isOpen = restaurant.IsOpen,
                isApproved = restaurant.IsApproved,
                createdAt = restaurant.CreatedAt
            });
        }
    }
}