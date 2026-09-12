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

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // CREATE
        [HttpPost]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> CreateRestaurant(
     CreateRestaurantDto dto)
        {
            var userId = GetCurrentUserId();

            // Prevent one restaurant account from creating multiple restaurants
            var existingRestaurant = await _context.Restaurants
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (existingRestaurant != null)
            {
                return BadRequest("This account already has a restaurant.");
            }

            var restaurant = new Restaurant
            {
                Name = dto.Name,
                Description = dto.Description,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                Address = dto.Address,
                ImageUrl = dto.ImageUrl,
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

        // READ - Get all restaurants
        [HttpGet]
        [AllowAnonymous]
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

        // READ - Get one restaurant
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRestaurant(int id)
        {
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

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> UpdateRestaurant(
            int id,
            UpdateRestaurantDto dto)
        {
            var userId = GetCurrentUserId();

            var isAdmin = User.IsInRole("Admin");

            var restaurantQuery = _context.Restaurants
                .Where(r => r.RestaurantId == id);

            if (!isAdmin)
            {
                restaurantQuery = restaurantQuery
                    .Where(r => r.UserId == userId);
            }

            var restaurant = await restaurantQuery.FirstOrDefaultAsync();

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
            }

            restaurant.Name = dto.Name;
            restaurant.Description = dto.Description;
            restaurant.PhoneNumber = dto.PhoneNumber;
            restaurant.Email = dto.Email;
            restaurant.Address = dto.Address;
            restaurant.ImageUrl = dto.ImageUrl;
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

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Restaurant,Admin")]
        public async Task<IActionResult> DeleteRestaurant(int id)
        {
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");

            var restaurantQuery = _context.Restaurants
                .Where(r => r.RestaurantId == id);

            if (!isAdmin)
            {
                restaurantQuery = restaurantQuery
                    .Where(r => r.UserId == userId);
            }

            var restaurant = await restaurantQuery.FirstOrDefaultAsync();

            if (restaurant == null)
            {
                return NotFound("Restaurant not found.");
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
