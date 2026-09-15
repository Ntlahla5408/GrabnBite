using GrabnBite.Data;
using GrabnBite.DTOs.Restaurant;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        // CREATE
        // =========================================================
        [HttpPost("user/{userId}")]
        public async Task<IActionResult> CreateRestaurant(
            int userId,
            CreateRestaurantDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
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

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound("User not found.");
            }

            // Prevent one user account from creating multiple restaurants
            var existingRestaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.UserId == userId);

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

                UserId = userId,

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
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetRestaurants()
        {
            var restaurants = await _context.Restaurants
                .ToListAsync();

            var response = restaurants.Select(r => new RestaurantResponseDto
            {
                RestaurantId = r.RestaurantId,
                Name = r.Name,
                Description = r.Description,
                PhoneNumber = r.PhoneNumber,
                Email = r.Email,
                Address = r.Address,
                ImageUrl = r.ImageUrl,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                IsOpen = r.IsOpen,
                IsApproved = r.IsApproved,
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(response);
        }

        // =========================================================
        // READ - Get one restaurant
        // =========================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRestaurant(int id)
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

            return Ok(response);
        }

        // =========================================================
        // UPDATE
        // =========================================================
        [HttpPut("user/{userId}/{id}")]
        public async Task<IActionResult> UpdateRestaurant(
            int userId,
            int id,
            UpdateRestaurantDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
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

            // The restaurant must belong to this user
            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.UserId == userId);

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

            return Ok(response);
        }

        // =========================================================
        // ADMIN UPDATE
        // =========================================================
        [HttpPut("admin/{id}")]
        public async Task<IActionResult> UpdateRestaurantAsAdmin(
            int id,
            UpdateRestaurantDto dto)
        {
            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
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
                .FirstOrDefaultAsync(r => r.RestaurantId == id);

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

            return Ok(new RestaurantResponseDto
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
            });
        }

        // =========================================================
        // DELETE
        // =========================================================
        [HttpDelete("user/{userId}/{id}")]
        public async Task<IActionResult> DeleteRestaurant(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (id <= 0)
            {
                return BadRequest("A valid restaurant id is required.");
            }

            // The restaurant must belong to this user
            var restaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r =>
                    r.RestaurantId == id &&
                    r.UserId == userId);

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
    }
}