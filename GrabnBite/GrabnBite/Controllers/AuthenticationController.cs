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

            // Public registration may create only Customer or Restaurant accounts.
            // Never trust a client-supplied role name or role ID.
            var accountType = string.IsNullOrWhiteSpace(registerUser.AccountType)
                ? "Customer"
                : registerUser.AccountType.Trim();

            if (!accountType.Equals("Customer", StringComparison.OrdinalIgnoreCase) &&
                !accountType.Equals("Restaurant", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(
                    "Account type must be either Customer or Restaurant.");
            }

            accountType = accountType.Equals(
                "Restaurant",
                StringComparison.OrdinalIgnoreCase)
                    ? "Restaurant"
                    : "Customer";

            var selectedRole = await dbContext.Roles
                .FirstOrDefaultAsync(r =>
                    r.Name.ToLower() == accountType.ToLower());

            if (selectedRole == null)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"{accountType} role has not been configured.");
            }

            // Hash password before opening the transaction.
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(
                registerUser.Password
            );

            await using var transaction =
                await dbContext.Database.BeginTransactionAsync();

            var user = new User
            {
                FirstName = registerUser.FirstName.Trim(),
                LastName = registerUser.LastName.Trim(),
                Email = email,
                PhoneNumber = registerUser.PhoneNumber.Trim(),
                PasswordHash = passwordHash,
                RoleId = selectedRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            RestaurantApplication? restaurantApplication = null;

            if (accountType == "Restaurant")
            {
                var now = DateTime.UtcNow;

                restaurantApplication = new RestaurantApplication
                {
                    UserId = user.UserId,
                    ApplicationReference =
                        $"GB-{Guid.NewGuid().ToString("N")[..20].ToUpperInvariant()}",
                    Status = RestaurantApplicationStatus.Draft,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                dbContext.RestaurantApplications.Add(restaurantApplication);
                await dbContext.SaveChangesAsync();

                dbContext.RestaurantApplicationHistories.Add(
                    new RestaurantApplicationHistory
                    {
                        RestaurantApplicationId =
                            restaurantApplication.RestaurantApplicationId,
                        PreviousStatus = null,
                        NewStatus = RestaurantApplicationStatus.Draft,
                        Action = "ApplicationCreated",
                        Comment = "Initial restaurant partner application created during registration.",
                        PerformedByUserId = user.UserId,
                        CreatedAt = now
                    });

                await dbContext.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return Ok(new
            {
                message = accountType == "Restaurant"
                    ? "Restaurant account registered. Your draft application is ready to complete."
                    : "User registered successfully.",
                userId = user.UserId,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                role = selectedRole.Name,
                restaurantApplication = restaurantApplication == null
                    ? null
                    : new
                    {
                        restaurantApplication.RestaurantApplicationId,
                        restaurantApplication.ApplicationReference,
                        status = restaurantApplication.Status.ToString()
                    }
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