using GrabnBite.Data;
using GrabnBite.Configuration;
using GrabnBite.Services;
using GrabnBite.Dto.AuthenticationDto;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AppDbContext dbContext;
        private readonly IConfiguration configuration;
        private readonly IEmailVerificationService emailVerificationService;
        private readonly EmailVerificationSettings emailVerificationSettings;
        private readonly ILogger<AuthenticationController> logger;

        public AuthenticationController(
            AppDbContext dbContext,
            IConfiguration configuration,
            IEmailVerificationService emailVerificationService,
            IOptions<EmailVerificationSettings> emailVerificationSettings,
            ILogger<AuthenticationController> logger)
        {
            this.dbContext = dbContext;
            this.configuration = configuration;
            this.emailVerificationService = emailVerificationService;
            this.emailVerificationSettings = emailVerificationSettings.Value;
            this.logger = logger;
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

            // Public registration may create Customer, Restaurant or Driver accounts.
            // Never trust a client-supplied role name or role ID.
            var accountType = string.IsNullOrWhiteSpace(registerUser.AccountType)
                ? "Customer"
                : registerUser.AccountType.Trim();

            if (!accountType.Equals("Customer", StringComparison.OrdinalIgnoreCase) &&
                !accountType.Equals("Restaurant", StringComparison.OrdinalIgnoreCase) &&
                !accountType.Equals("Driver", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(
                    "Account type must be Customer, Restaurant or Driver.");
            }

            accountType = accountType.Equals("Restaurant", StringComparison.OrdinalIgnoreCase)
                ? "Restaurant"
                : accountType.Equals("Driver", StringComparison.OrdinalIgnoreCase)
                    ? "Driver"
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
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            var now = DateTime.UtcNow;
            var verificationCode = emailVerificationService.GenerateCode();

            dbContext.EmailVerificationChallenges.Add(
                new EmailVerificationChallenge
                {
                    UserId = user.UserId,
                    CodeHash = emailVerificationService.HashCode(
                        user.UserId,
                        verificationCode),
                    CreatedAt = now,
                    LastSentAt = now,
                    ExpiresAt = now.AddMinutes(
                        emailVerificationSettings.CodeLifetimeMinutes),
                    FailedAttempts = 0,
                    ResendCount = 0,
                    ResendWindowStartedAt = now
                });

            await dbContext.SaveChangesAsync();

            RestaurantApplication? restaurantApplication = null;

            if (accountType == "Restaurant")
            {
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

            DriverApplication? driverApplication = null;

            if (accountType == "Driver")
            {
                driverApplication = new DriverApplication
                {
                    UserId = user.UserId,
                    ApplicationReference =
                        $"GBD-{Guid.NewGuid().ToString("N")[..20].ToUpperInvariant()}",
                    Status = DriverApplicationStatus.Draft,
                    FullLegalName = $"{user.FirstName} {user.LastName}",
                    Surname = user.LastName,
                    MobileNumber = user.PhoneNumber,
                    EmailAddress = user.Email,
                    SignatureFullLegalName = $"{user.FirstName} {user.LastName}",
                    SignatureEmailAddress = user.Email,
                    SignatureMobileNumber = user.PhoneNumber,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                dbContext.DriverApplications.Add(driverApplication);
                await dbContext.SaveChangesAsync();

                dbContext.DriverApplicationHistories.Add(
                    new DriverApplicationHistory
                    {
                        DriverApplicationId = driverApplication.DriverApplicationId,
                        PreviousStatus = null,
                        NewStatus = DriverApplicationStatus.Draft,
                        Action = "ApplicationCreated",
                        Comment = "Initial delivery partner application created during registration.",
                        PerformedByUserId = user.UserId,
                        CreatedAt = now
                    });

                await dbContext.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            var emailSent = true;
            try
            {
                await emailVerificationService.SendVerificationCodeAsync(
                    user,
                    verificationCode);
            }
            catch (Exception exception)
            {
                emailSent = false;
                logger.LogError(
                    exception,
                    "Email verification delivery failed for newly registered user {UserId}.",
                    user.UserId);
            }

            return Ok(new
            {
                message = emailSent
                    ? "Account created. A verification code has been sent to your email address."
                    : "Account created, but the verification email could not be sent. You can request another code.",
                emailVerificationRequired = true,
                emailSent,
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
                    },
                driverApplication = driverApplication == null
                    ? null
                    : new
                    {
                        driverApplication.DriverApplicationId,
                        driverApplication.ApplicationReference,
                        status = driverApplication.Status.ToString()
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

            if (!user.IsEmailVerified)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        code = "EMAIL_NOT_VERIFIED",
                        message = "Verify your email address before signing in."
                    });
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
        // VERIFY EMAIL
        // POST: api/Authentication/verify-email
        // Public endpoint
        // ============================================================

        [AllowAnonymous]
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(
            [FromBody] VerifyEmailDto request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest("Email and verification code are required.");
            }

            var code = request.Code.Trim();
            if (code.Length != 6 || code.Any(character =>
                character < '0' || character > '9'))
            {
                return BadRequest("Enter the six-digit verification code.");
            }

            var email = request.Email.Trim().ToLowerInvariant();
            var user = await dbContext.Users.FirstOrDefaultAsync(
                candidate => candidate.Email.ToLower() == email);

            if (user == null)
            {
                return BadRequest("The verification code is invalid or expired.");
            }

            if (user.IsEmailVerified)
            {
                return Ok(new
                {
                    message = "Your email address is already verified.",
                    emailVerified = true
                });
            }

            var challenge = await dbContext.EmailVerificationChallenges
                .FirstOrDefaultAsync(candidate => candidate.UserId == user.UserId);

            if (challenge == null)
            {
                return BadRequest("The verification code is invalid or expired. Request a new code.");
            }

            if (challenge.ExpiresAt <= DateTime.UtcNow)
            {
                return BadRequest("The verification code has expired. Request a new code.");
            }

            if (challenge.FailedAttempts >= emailVerificationSettings.MaxFailedAttempts)
            {
                return BadRequest("Too many incorrect attempts. Request a new code.");
            }

            if (!emailVerificationService.VerifyCode(
                user.UserId,
                code,
                challenge.CodeHash))
            {
                challenge.FailedAttempts++;
                await dbContext.SaveChangesAsync();

                return BadRequest(
                    challenge.FailedAttempts >= emailVerificationSettings.MaxFailedAttempts
                        ? "Too many incorrect attempts. Request a new code."
                        : "The verification code is incorrect.");
            }

            await using var transaction =
                await dbContext.Database.BeginTransactionAsync();

            user.IsEmailVerified = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            dbContext.EmailVerificationChallenges.Remove(challenge);

            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Your email address has been verified. You can now sign in.",
                emailVerified = true
            });
        }

        // ============================================================
        // RESEND EMAIL VERIFICATION
        // POST: api/Authentication/resend-verification
        // Public endpoint
        // ============================================================

        [AllowAnonymous]
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(
            [FromBody] ResendEmailVerificationDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required.");
            }

            const string genericMessage =
                "If this account exists and still needs verification, a new code will be sent.";

            var email = request.Email.Trim().ToLowerInvariant();
            var user = await dbContext.Users.FirstOrDefaultAsync(
                candidate => candidate.Email.ToLower() == email);

            if (user == null || user.IsEmailVerified)
            {
                return Ok(new { message = genericMessage });
            }

            var now = DateTime.UtcNow;
            var challenge = await dbContext.EmailVerificationChallenges
                .FirstOrDefaultAsync(candidate => candidate.UserId == user.UserId);

            if (challenge != null &&
                now - challenge.LastSentAt <
                    TimeSpan.FromSeconds(emailVerificationSettings.ResendCooldownSeconds))
            {
                return Ok(new { message = genericMessage });
            }

            if (challenge != null &&
                now - challenge.ResendWindowStartedAt >= TimeSpan.FromHours(1))
            {
                challenge.ResendWindowStartedAt = now;
                challenge.ResendCount = 0;
            }

            if (challenge != null &&
                challenge.ResendCount >= emailVerificationSettings.MaxResendsPerHour)
            {
                return Ok(new { message = genericMessage });
            }

            var verificationCode = emailVerificationService.GenerateCode();

            if (challenge == null)
            {
                challenge = new EmailVerificationChallenge
                {
                    UserId = user.UserId,
                    CreatedAt = now,
                    ResendWindowStartedAt = now,
                    ResendCount = 0
                };

                dbContext.EmailVerificationChallenges.Add(challenge);
            }
            else
            {
                challenge.ResendCount++;
            }

            challenge.CodeHash = emailVerificationService.HashCode(
                user.UserId,
                verificationCode);
            challenge.LastSentAt = now;
            challenge.ExpiresAt = now.AddMinutes(
                emailVerificationSettings.CodeLifetimeMinutes);
            challenge.FailedAttempts = 0;

            await dbContext.SaveChangesAsync();

            try
            {
                await emailVerificationService.SendVerificationCodeAsync(
                    user,
                    verificationCode);

                return Ok(new { message = genericMessage });
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Email verification resend failed for user {UserId}.",
                    user.UserId);

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        code = "EMAIL_DELIVERY_UNAVAILABLE",
                        message = "The verification email could not be sent right now. Please try again later."
                    });
            }
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