using GrabnBite.Data;
using GrabnBite.DTOs.User;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL USERS
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserResponseDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET ONE USER
        // =========================================================
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new UserResponseDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(user);
        }

        // =========================================================
        // UPDATE USER
        // =========================================================
        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateUser(
            int userId,
            UpdateUserDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.FirstName))
            {
                return BadRequest("First name is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.LastName))
            {
                return BadRequest("Last name is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Email is required.");
            }

            if (!dto.Email.Contains("@"))
            {
                return BadRequest("Please provide a valid email address.");
            }

            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                return BadRequest("Phone number is required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Check whether another user already uses this email
            var emailExists = await _context.Users
                .AnyAsync(u =>
                    u.UserId != userId &&
                    u.Email.ToLower() == dto.Email.Trim().ToLower());

            if (emailExists)
            {
                return BadRequest(
                    "Another account is already using this email address.");
            }

            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
            user.Email = dto.Email.Trim();
            user.PhoneNumber = dto.PhoneNumber.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return Ok(response);
        }

        // =========================================================
        // UPDATE USER ROLE
        // =========================================================
        [HttpPut("{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(
            int userId,
            UpdateUserRoleDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var role = dto.Role?.Trim().ToLowerInvariant() switch
            {
                "customer" => "Customer",
                "restaurant" => "Restaurant",
                "driver" => "Driver",
                "admin" => "Admin",
                _ => null
            };

            if (role == null)
            {
                return BadRequest(
                    "Role must be customer, restaurant, driver, or admin.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.Role = role;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }

        // =========================================================
        // UPDATE USER ACTIVE STATE
        // =========================================================
        [HttpPut("{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(
            int userId,
            UpdateUserStatusDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }

        // =========================================================
        // DELETE USER
        // =========================================================
        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User deleted successfully."
            });
        }
    }
}