using GrabnBite.Data;
using GrabnBite.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL USERS
        // ADMIN ONLY
        // =========================================================
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Select(u => new UserResponseDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET ONE USER
        // ADMIN OR THE USER THEMSELVES
        // =========================================================
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            if (!User.IsInRole("Admin") && currentUserId.Value != userId)
            {
                return Forbid();
            }

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserId == userId)
                .Select(u => new UserResponseDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role.Name,
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
        // ADMIN OR THE USER THEMSELVES
        // =========================================================
        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateUser(
            int userId,
            [FromBody] UpdateUserDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (dto == null)
            {
                return BadRequest("User data is required.");
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized();
            }

            if (!User.IsInRole("Admin") && currentUserId.Value != userId)
            {
                return Forbid();
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

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var emailExists = await _context.Users
                .AnyAsync(u =>
                    u.UserId != userId &&
                    u.Email.ToLower() == normalizedEmail);

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

            var roleName = await _context.Roles
                .Where(r => r.RoleId == user.RoleId)
                .Select(r => r.Name)
                .FirstOrDefaultAsync();

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = roleName ?? "Unknown",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }

        // =========================================================
        // UPDATE USER ROLE
        // ADMIN ONLY
        // =========================================================
        [HttpPut("{userId}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(
            int userId,
            [FromBody] UpdateUserRoleDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest("Role is required.");
            }

            var roleName = dto.Role.Trim();

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.Name.ToLower() == roleName.ToLower());

            if (role == null)
            {
                return BadRequest(
                    "Role must be Customer, Restaurant, Driver, or Admin.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.RoleId = role.RoleId;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = role.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }

        // =========================================================
        // UPDATE USER ACTIVE STATE
        // ADMIN ONLY
        // =========================================================
        [HttpPut("{userId}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserStatus(
            int userId,
            [FromBody] UpdateUserStatusDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

            if (dto == null)
            {
                return BadRequest("Status data is required.");
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

            var roleName = await _context.Roles
                .Where(r => r.RoleId == user.RoleId)
                .Select(r => r.Name)
                .FirstOrDefaultAsync();

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = roleName ?? "Unknown",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }

        // =========================================================
        // DELETE USER
        // ADMIN ONLY
        // =========================================================
        [HttpDelete("{userId}")]
        [Authorize(Roles = "Admin")]
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

        // =========================================================
        // GET CURRENT USER ID FROM JWT
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out var userId)
                ? userId
                : null;
        }
    }
}