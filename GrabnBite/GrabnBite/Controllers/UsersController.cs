using GrabnBite.Data;
using GrabnBite.DTOs.User;
using GrabnBite.Configuration;
using GrabnBite.Services;
using Microsoft.Extensions.Options;
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
        private readonly ICloudinaryImageService _cloudinary;
        private readonly IEmailVerificationService _emailVerificationService;
        private readonly EmailVerificationSettings _emailVerificationSettings;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            AppDbContext context,
            ICloudinaryImageService cloudinary,
            IEmailVerificationService emailVerificationService,
            IOptions<EmailVerificationSettings> emailVerificationSettings,
            ILogger<UsersController> logger)
        {
            _context = context;
            _cloudinary = cloudinary;
            _emailVerificationService = emailVerificationService;
            _emailVerificationSettings = emailVerificationSettings.Value;
            _logger = logger;
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
                    ProfileImageUrl = u.ProfileImageUrl,
                    IsEmailVerified = u.IsEmailVerified,
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
                    ProfileImageUrl = u.ProfileImageUrl,
                    IsEmailVerified = u.IsEmailVerified,
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

            if (!string.Equals(
                dto.Email.Trim(),
                user.Email,
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(
                    "Email addresses must be changed through the email verification process.");
            }

            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
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
                ProfileImageUrl = user.ProfileImageUrl,
                IsEmailVerified = user.IsEmailVerified,
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
                ProfileImageUrl = user.ProfileImageUrl,
                IsEmailVerified = user.IsEmailVerified,
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
                ProfileImageUrl = user.ProfileImageUrl,
                IsEmailVerified = user.IsEmailVerified,
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
        // CURRENT USER PROFILE
        // Available to every authenticated account role.
        // =========================================================
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, cancellationToken);

            return user == null ? NotFound("User not found.") : Ok(MapUserResponse(user));
        }

        // =========================================================
        // CHANGE PASSWORD
        // Requires the current password.
        // =========================================================
        [HttpPut("me/password")]
        public async Task<IActionResult> ChangeMyPassword(
            [FromBody] ChangePasswordDto dto,
            CancellationToken cancellationToken)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("Current and new passwords are required.");

            if (dto.NewPassword.Length < 8)
                return BadRequest("Your new password must contain at least 8 characters.");

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.UserId == currentUserId.Value, cancellationToken);
            if (user == null) return NotFound("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest("Your current password is incorrect.");

            if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, user.PasswordHash))
                return BadRequest("Your new password must be different from your current password.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Your password has been updated." });
        }

        // =========================================================
        // REQUEST EMAIL CHANGE
        // The current email remains active until the new address is verified.
        // =========================================================
        [HttpPost("me/request-email-change")]
        public async Task<IActionResult> RequestEmailChange(
            [FromBody] RequestEmailChangeDto dto,
            CancellationToken cancellationToken)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                string.IsNullOrWhiteSpace(dto.NewEmail))
                return BadRequest("Current password and new email address are required.");

            var targetEmail = dto.NewEmail.Trim().ToLowerInvariant();
            try
            {
                var parsedEmail = new System.Net.Mail.MailAddress(targetEmail);
                if (!string.Equals(parsedEmail.Address, targetEmail, StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Please provide a valid email address.");
            }
            catch (FormatException)
            {
                return BadRequest("Please provide a valid email address.");
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.UserId == currentUserId.Value, cancellationToken);
            if (user == null) return NotFound("User not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest("Your current password is incorrect.");

            if (string.Equals(user.Email, targetEmail, StringComparison.OrdinalIgnoreCase))
                return BadRequest("That is already your current email address.");

            var emailInUse = await _context.Users.AnyAsync(
                u => u.UserId != user.UserId && u.Email.ToLower() == targetEmail,
                cancellationToken);
            if (emailInUse)
                return Conflict("Another account is already using this email address.");

            var now = DateTime.UtcNow;
            var challenge = await _context.EmailVerificationChallenges.FirstOrDefaultAsync(
                item => item.UserId == user.UserId, cancellationToken);

            if (challenge != null &&
                now - challenge.LastSentAt < TimeSpan.FromSeconds(_emailVerificationSettings.ResendCooldownSeconds))
                return StatusCode(StatusCodes.Status429TooManyRequests,
                    "Please wait before requesting another verification code.");

            var code = _emailVerificationService.GenerateCode();
            if (challenge == null)
            {
                challenge = new EmailVerificationChallenge
                {
                    UserId = user.UserId,
                    CreatedAt = now,
                    ResendWindowStartedAt = now
                };
                _context.EmailVerificationChallenges.Add(challenge);
            }

            challenge.TargetEmail = targetEmail;
            challenge.CodeHash = _emailVerificationService.HashCode(user.UserId, code);
            challenge.LastSentAt = now;
            challenge.ExpiresAt = now.AddMinutes(_emailVerificationSettings.CodeLifetimeMinutes);
            challenge.FailedAttempts = 0;

            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                await _emailVerificationService.SendEmailChangeCodeAsync(
                    user, targetEmail, code, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception,
                    "Email-change verification delivery failed for user {UserId}.", user.UserId);
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    "The verification email could not be sent. Please try again shortly.");
            }

            return Ok(new
            {
                message = "A verification code has been sent to your new email address.",
                targetEmail,
                expiresInMinutes = _emailVerificationSettings.CodeLifetimeMinutes
            });
        }

        // =========================================================
        // VERIFY EMAIL CHANGE
        // =========================================================
        [HttpPost("me/verify-email-change")]
        public async Task<IActionResult> VerifyEmailChange(
            [FromBody] VerifyEmailChangeDto dto,
            CancellationToken cancellationToken)
        {
            var code = dto?.Code?.Trim();
            if (string.IsNullOrWhiteSpace(code) || code.Length != 6 ||
                code.Any(character => character < '0' || character > '9'))
                return BadRequest("Enter the six-digit verification code.");

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, cancellationToken);
            if (user == null) return NotFound("User not found.");

            var challenge = await _context.EmailVerificationChallenges.FirstOrDefaultAsync(
                item => item.UserId == user.UserId && item.TargetEmail != null,
                cancellationToken);
            if (challenge == null)
                return BadRequest("There is no pending email change. Request a new one.");

            if (challenge.ExpiresAt <= DateTime.UtcNow)
                return BadRequest("The verification code has expired. Request a new one.");

            if (challenge.FailedAttempts >= _emailVerificationSettings.MaxFailedAttempts)
                return BadRequest("Too many incorrect attempts. Request a new verification code.");

            if (!_emailVerificationService.VerifyCode(user.UserId, code, challenge.CodeHash))
            {
                challenge.FailedAttempts++;
                await _context.SaveChangesAsync(cancellationToken);
                return BadRequest("The verification code is incorrect.");
            }

            var targetEmail = challenge.TargetEmail!;
            var emailInUse = await _context.Users.AnyAsync(
                item => item.UserId != user.UserId &&
                    item.Email.ToLower() == targetEmail.ToLower(),
                cancellationToken);
            if (emailInUse)
                return Conflict("Another account is already using that email address.");

            user.Email = targetEmail;
            user.IsEmailVerified = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            _context.EmailVerificationChallenges.Remove(challenge);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "Your email address has been updated and verified.",
                user = MapUserResponse(user)
            });
        }

        // =========================================================
        // UPLOAD / REPLACE PERSONAL PROFILE PHOTO
        // Available to every authenticated account role.
        // =========================================================
        [HttpPost("me/profile-photo")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadMyProfilePhoto(
            [FromForm] IFormFile? image,
            CancellationToken cancellationToken)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.UserId == currentUserId.Value, cancellationToken);
            if (user == null) return NotFound("User not found.");

            var validationError = await ImageUploadValidation.ValidateAsync(image, cancellationToken);
            if (validationError != null) return BadRequest(validationError);

            var oldPublicId = user.ProfileImagePublicId;
            CloudinaryUploadResult uploaded;
            await using (var stream = image!.OpenReadStream())
            {
                uploaded = await _cloudinary.UploadImageAsync(
                    stream,
                    $"user-{user.UserId}-{Guid.NewGuid():N}{GetImageExtension(image.ContentType)}",
                    image.ContentType,
                    $"user-profiles/{user.UserId}",
                    cancellationToken);
            }

            user.ProfileImageUrl = uploaded.SecureUrl;
            user.ProfileImagePublicId = uploaded.PublicId;
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                try { await _cloudinary.DeleteImageAsync(uploaded.PublicId, cancellationToken); }
                catch (Exception cleanupException)
                {
                    _logger.LogError(cleanupException,
                        "Could not clean up uploaded profile image {PublicId}.", uploaded.PublicId);
                }
                throw;
            }

            if (!string.IsNullOrWhiteSpace(oldPublicId))
            {
                try { await _cloudinary.DeleteImageAsync(oldPublicId, cancellationToken); }
                catch (Exception cleanupException)
                {
                    _logger.LogWarning(cleanupException,
                        "Replaced profile image {PublicId} could not be deleted from Cloudinary.", oldPublicId);
                }
            }

            return Ok(new { profileImageUrl = user.ProfileImageUrl });
        }

        // =========================================================
        // REMOVE PERSONAL PROFILE PHOTO
        // =========================================================
        [HttpDelete("me/profile-photo")]
        public async Task<IActionResult> DeleteMyProfilePhoto(CancellationToken cancellationToken)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.UserId == currentUserId.Value, cancellationToken);
            if (user == null) return NotFound("User not found.");

            var oldPublicId = user.ProfileImagePublicId;
            user.ProfileImageUrl = null;
            user.ProfileImagePublicId = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(oldPublicId))
            {
                try { await _cloudinary.DeleteImageAsync(oldPublicId, cancellationToken); }
                catch (Exception cleanupException)
                {
                    _logger.LogWarning(cleanupException,
                        "Removed profile image {PublicId} could not be deleted from Cloudinary.", oldPublicId);
                }
            }

            return Ok(new { message = "Your profile photo has been removed." });
        }

        private static string GetImageExtension(string contentType) =>
            contentType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

        private static UserResponseDto MapUserResponse(User user) => new()
        {
            UserId = user.UserId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role?.Name ?? "Unknown",
            ProfileImageUrl = user.ProfileImageUrl,
            IsEmailVerified = user.IsEmailVerified,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };

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