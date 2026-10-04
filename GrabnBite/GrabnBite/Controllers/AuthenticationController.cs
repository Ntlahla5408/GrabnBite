using GrabnBite.Data;
using GrabnBite.Dto.AuthenticationDto;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AppDbContext dbContext;
        private readonly IConfiguration configuration;

        public AuthenticationController(
            AppDbContext dbContext,
            IConfiguration configuration)
        {
            this.dbContext = dbContext;
            this.configuration = configuration;
        }

        // ============================================================
        // REGISTER
        // POST: api/Authentication/register
        // Public endpoint
        // ============================================================

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterUserDto registerUser)
        {
            if (registerUser == null)
            {
                return BadRequest("Registration data is required.");
            }

            if (string.IsNullOrWhiteSpace(registerUser.FirstName))
            {
                return BadRequest("First name is required.");
            }

            if (string.IsNullOrWhiteSpace(registerUser.LastName))
            {
                return BadRequest("Last name is required.");
            }

            if (string.IsNullOrWhiteSpace(registerUser.Email))
            {
                return BadRequest("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(registerUser.Password))
            {
                return BadRequest("Password is required.");
            }

            if (string.IsNullOrWhiteSpace(registerUser.PhoneNumber))
            {
                return BadRequest("Phone number is required.");
            }

            var email = registerUser.Email.Trim().ToLowerInvariant();

            // Check whether the email already exists
            var existingUser = await dbContext.Users
                .AnyAsync(u => u.Email.ToLower() == email);

            if (existingUser)
            {
                return BadRequest(
                    "A user with this email already exists.");
            }

            // Find the Customer role
            var customerRole = await dbContext.Roles
                .FirstOrDefaultAsync(r =>
                    r.Name.ToLower() == "customer");

            if (customerRole == null)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    "Customer role has not been configured.");
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(
                registerUser.Password
            );

            // Create user
            var user = new User
            {
                FirstName = registerUser.FirstName.Trim(),
                LastName = registerUser.LastName.Trim(),
                Email = email,
                PhoneNumber = registerUser.PhoneNumber.Trim(),
                PasswordHash = passwordHash,
                RoleId = customerRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(user);

            await dbContext.SaveChangesAsync();

            return Ok(new
            {
                message = "User registered successfully.",
                userId = user.UserId,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                role = customerRole.Name
            });
        }

        // ============================================================
        // LOGIN
        // POST: api/Authentication/login
        // Public endpoint
        // ============================================================

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto loginDto)
        {
            if (loginDto == null)
            {
                return BadRequest("Login data is required.");
            }

            if (string.IsNullOrWhiteSpace(loginDto.Email))
            {
                return BadRequest("Email is required.");
            }

            if (string.IsNullOrWhiteSpace(loginDto.Password))
            {
                return BadRequest("Password is required.");
            }

            var email = loginDto.Email.Trim().ToLowerInvariant();

            // Include Role because JWT needs the role name
            var user = await dbContext.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == email);

            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            if (!user.IsActive)
            {
                return Unauthorized(
                    "This account has been disabled.");
            }

            var passwordIsValid = BCrypt.Net.BCrypt.Verify(
                loginDto.Password,
                user.PasswordHash
            );

            if (!passwordIsValid)
            {
                return Unauthorized("Invalid credentials.");
            }

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token = token,
                userId = user.UserId,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                role = user.Role.Name
            });
        }

        // ============================================================
        // GENERATE JWT
        // ============================================================

        private string GenerateJwtToken(User user)
        {
            var keyValue = configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(keyValue))
            {
                throw new InvalidOperationException(
                    "Jwt:Key is not configured.");
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(keyValue)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new[]
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    user.UserId.ToString()
                ),

                new Claim(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString()
                ),

                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.UserId.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    user.Email
                ),

                new Claim(
                    ClaimTypes.Role,
                    user.Role.Name
                )
            };

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        // ============================================================
        // AUTHORIZATION TEST
        // GET: api/Authentication/test
        // Any authenticated user
        // ============================================================

        [Authorize]
        [HttpGet("test")]
        public IActionResult TestAuthorization()
        {
            return Ok("You are authenticated.");
        }

        // ============================================================
        // ADMIN AUTHORIZATION TEST
        // GET: api/Authentication/admin-test
        // Admin only
        // ============================================================

        [Authorize(Roles = "Admin")]
        [HttpGet("admin-test")]
        public IActionResult AdminTest()
        {
            return Ok("You are an Admin.");
        }
    }
}