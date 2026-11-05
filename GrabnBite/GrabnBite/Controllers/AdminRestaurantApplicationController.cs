using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.Models.Entities;
using GrabnBite.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminRestaurantApplicationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ISupabaseRestaurantDocumentStorageService _documentStorage;

        public AdminRestaurantApplicationController(
            AppDbContext context,
            ISupabaseRestaurantDocumentStorageService documentStorage)
        {
            _context = context;
            _documentStorage = documentStorage;
        }

        [HttpGet]
        public async Task<IActionResult> GetApplications(
            [FromQuery] RestaurantApplicationStatus? status,
            CancellationToken cancellationToken)
        {
            var query = _context.RestaurantApplications
                .AsNoTracking()
                .Include(application => application.User)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(application => application.Status == status.Value);

            var applications = await query
                .OrderByDescending(application => application.SubmittedAt ?? application.UpdatedAt)
                .Select(application => new
                {
                    application.RestaurantApplicationId,
                    application.ApplicationReference,
                    status = application.Status.ToString(),
                    application.TradingName,
                    application.RegisteredBusinessName,
                    applicantName = application.User.FirstName + " " + application.User.LastName,
                    applicantEmail = application.User.Email,
                    applicantEmailVerified = application.User.IsEmailVerified,
                    application.SubmittedAt,
                    application.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return Ok(applications);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetApplication(
            int id,
            CancellationToken cancellationToken)
        {
            var application = await _context.RestaurantApplications
                .AsNoTracking()
                .Include(item => item.User)
                .Include(item => item.Documents)
                .Include(item => item.OperatingHours)
                .Include(item => item.BankingDetails)
                .Include(item => item.History)
                .FirstOrDefaultAsync(item => item.RestaurantApplicationId == id, cancellationToken);

            if (application == null)
                return NotFound("Restaurant application not found.");

            var documents = new List<object>();
            foreach (var document in application.Documents.OrderBy(item => item.UploadedAt))
            {
                documents.Add(new
                {
                    document.RestaurantDocumentId,
                    documentType = document.DocumentType.ToString(),
                    document.DocumentDescription,
                    document.OriginalFileName,
                    document.ContentType,
                    document.FileSize,
                    verificationStatus = document.VerificationStatus.ToString(),
                    document.AdminComment,
                    document.UploadedAt,
                    signedUrl = await _documentStorage.CreateSignedUrlAsync(
                        document.StoragePath, 900, cancellationToken)
                });
            }

            var banking = application.BankingDetails;
            string? maskedAccountNumber = null;
            if (banking != null && !string.IsNullOrWhiteSpace(banking.AccountNumberEncrypted))
            {
                // Only expose a mask; the encrypted value is never returned to the admin client.
                maskedAccountNumber = "Encrypted account on file";
            }

            return Ok(new
            {
                application.RestaurantApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString(),
                applicant = new
                {
                    application.User.UserId,
                    application.User.FirstName,
                    application.User.LastName,
                    application.User.Email,
                    application.User.PhoneNumber,
                    application.User.IsEmailVerified
                },
                application.TradingName,
                application.RegisteredBusinessName,
                application.CipcRegistrationNumber,
                application.RestaurantCategory,
                application.PhysicalAddress,
                application.City,
                application.RestaurantContactNumber,
                application.BusinessEmail,
                application.WebsiteOrSocialMediaUrl,
                application.RepresentativeFullName,
                application.RepresentativePosition,
                application.RepresentativeMobileNumber,
                application.RepresentativeEmail,
                application.HasAuthorityToRepresent,
                application.OffersCustomerCollection,
                application.OffersRestaurantDelivery,
                application.OffersGrubnBiteDelivery,
                application.AveragePreparationTimeMinutes,
                application.MaximumDeliveryDistanceKm,
                application.DeliveryInstructions,
                application.CommissionOfferAccepted,
                application.SubmittedAt,
                application.AdminComments,
                application.DocumentsRequestedMessage,
                application.RejectionReason,
                documents,
                bankingDetails = banking == null ? null : new
                {
                    banking.AccountHolderName,
                    banking.BankName,
                    banking.AccountType,
                    maskedAccountNumber,
                    banking.BranchCode,
                    banking.PayoutContactEmail,
                    verificationStatus = banking.VerificationStatus.ToString(),
                    banking.VerifiedAt
                },
                operatingHours = application.OperatingHours
                    .OrderBy(hour => hour.DayOfWeek)
                    .Select(hour => new
                    {
                        dayOfWeek = hour.DayOfWeek.ToString(),
                        hour.IsOpen,
                        openingTime = hour.OpeningTime.HasValue
                            ? hour.OpeningTime.Value.ToString("HH:mm")
                            : null,
                        closingTime = hour.ClosingTime.HasValue
                            ? hour.ClosingTime.Value.ToString("HH:mm")
                            : null
                    }),
                history = application.History
                    .OrderByDescending(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Action,
                        previousStatus = item.PreviousStatus.HasValue
                            ? item.PreviousStatus.Value.ToString()
                            : null,
                        newStatus = item.NewStatus.HasValue
                            ? item.NewStatus.Value.ToString()
                            : null,
                        item.Comment,
                        item.CreatedAt
                    })
            });
        }

        [HttpPut("{id:int}/documents/{documentId:int}/review")]
        public async Task<IActionResult> ReviewDocument(
            int id,
            int documentId,
            [FromBody] ReviewRestaurantDocumentRequest request,
            CancellationToken cancellationToken)
        {
            if (!Enum.TryParse<RestaurantVerificationStatus>(request.Status, true, out var status) ||
                status is not RestaurantVerificationStatus.Approved and not RestaurantVerificationStatus.Rejected)
                return BadRequest("Document status must be Approved or Rejected.");

            if (status == RestaurantVerificationStatus.Rejected &&
                string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("A comment is required when rejecting a document.");

            var document = await _context.RestaurantDocuments
                .Include(item => item.RestaurantApplication)
                .FirstOrDefaultAsync(
                    item => item.RestaurantDocumentId == documentId &&
                        item.RestaurantApplicationId == id,
                    cancellationToken);

            if (document == null)
                return NotFound("Application document not found.");

            if (document.RestaurantApplication.Status is RestaurantApplicationStatus.Approved
                or RestaurantApplicationStatus.Rejected)
                return Conflict("A completed application cannot be changed.");

            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            document.VerificationStatus = status;
            document.AdminComment = request.Comment?.Trim();
            document.VerifiedByUserId = adminId;
            document.VerifiedAt = now;
            document.RestaurantApplication.UpdatedAt = now;

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = document.RestaurantApplication.Status,
                NewStatus = document.RestaurantApplication.Status,
                Action = "DocumentReviewed",
                Comment = $"{document.DocumentType} document marked {status}. {request.Comment}".Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { document.RestaurantDocumentId, status = status.ToString(), document.AdminComment });
        }

        [HttpPut("{id:int}/banking/review")]
        public async Task<IActionResult> ReviewBankingDetails(
            int id,
            [FromBody] ReviewRestaurantBankingRequest request,
            CancellationToken cancellationToken)
        {
            var application = await _context.RestaurantApplications
                .Include(item => item.BankingDetails)
                .FirstOrDefaultAsync(item => item.RestaurantApplicationId == id, cancellationToken);

            if (application == null) return NotFound("Restaurant application not found.");
            if (application.BankingDetails == null) return NotFound("Banking details have not been provided.");
            if (application.Status is RestaurantApplicationStatus.Approved
                or RestaurantApplicationStatus.Rejected)
                return Conflict("A completed application cannot be changed.");
            if (!request.IsApproved && string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("A comment is required when rejecting banking details.");

            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            application.BankingDetails.VerificationStatus = request.IsApproved
                ? RestaurantVerificationStatus.Approved
                : RestaurantVerificationStatus.Rejected;
            application.BankingDetails.VerifiedByUserId = adminId;
            application.BankingDetails.VerifiedAt = now;
            application.BankingDetails.UpdatedAt = now;
            application.UpdatedAt = now;

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "BankingDetailsReviewed",
                Comment = request.IsApproved
                    ? "Payout banking details verified."
                    : $"Payout banking details rejected. {request.Comment}".Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new
            {
                verificationStatus = application.BankingDetails.VerificationStatus.ToString(),
                application.BankingDetails.VerifiedAt
            });
        }

        [HttpPut("{id:int}/request-documents")]
        public Task<IActionResult> RequestDocuments(
            int id,
            [FromBody] RestaurantApplicationAdminCommentRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
                return Task.FromResult<IActionResult>(
                    BadRequest("A message explaining the required documents is required."));

            return ChangeStatus(
                id,
                RestaurantApplicationStatus.DocumentsRequired,
                "DocumentsRequested",
                request.Comment,
                cancellationToken);
        }

        [HttpPut("{id:int}/under-verification")]
        public Task<IActionResult> MarkUnderVerification(
            int id,
            [FromBody] RestaurantApplicationAdminCommentRequest request,
            CancellationToken cancellationToken) =>
            ChangeStatus(
                id,
                RestaurantApplicationStatus.UnderVerification,
                "VerificationStarted",
                request.Comment,
                cancellationToken);

        [HttpPut("{id:int}/reject")]
        public Task<IActionResult> RejectApplication(
            int id,
            [FromBody] RestaurantApplicationAdminCommentRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
                return Task.FromResult<IActionResult>(
                    BadRequest("A rejection reason is required."));

            return ChangeStatus(
                id,
                RestaurantApplicationStatus.Rejected,
                "ApplicationRejected",
                request.Comment,
                cancellationToken);
        }

        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> ApproveApplication(
            int id,
            CancellationToken cancellationToken)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            // Keep restaurant profile creation, account-role assignment, commission
            // configuration and application approval in one atomic operation.
            await using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable, cancellationToken);

            var application = await _context.RestaurantApplications
                .Include(item => item.User)
                    .ThenInclude(user => user.Role)
                .Include(item => item.Documents)
                .Include(item => item.BankingDetails)
                .Include(item => item.Restaurant)
                .FirstOrDefaultAsync(item => item.RestaurantApplicationId == id, cancellationToken);

            if (application == null) return NotFound("Restaurant application not found.");
            if (!application.User.IsActive)
                return Conflict("An inactive user account cannot be approved as a restaurant partner.");
            if (!application.User.IsEmailVerified)
                return Conflict("The applicant's email address has not been verified.");
            if (!string.Equals(application.User.Role.Name, "Customer", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(application.User.Role.Name, "Restaurant", StringComparison.OrdinalIgnoreCase))
                return Conflict("Only customer accounts can be converted into restaurant partner accounts.");
            if (application.Status is not RestaurantApplicationStatus.UnderVerification
                and not RestaurantApplicationStatus.PendingReview)
                return Conflict("Only an application under review can be approved.");

            var requiredDocuments = new[]
            {
                RestaurantDocumentType.CipcCertificate,
                RestaurantDocumentType.FoodPremisesCertificate,
                RestaurantDocumentType.IdentityOrAuthority,
                RestaurantDocumentType.BankConfirmation
            };

            var unapprovedDocuments = requiredDocuments.Where(required =>
                !application.Documents.Any(document =>
                    document.DocumentType == required &&
                    document.VerificationStatus == RestaurantVerificationStatus.Approved))
                .Select(required => required.ToString())
                .ToList();

            if (unapprovedDocuments.Count > 0)
                return Conflict(new
                {
                    message = "All required documents must be approved before the application can be approved.",
                    unapprovedDocuments
                });

            if (application.BankingDetails?.VerificationStatus != RestaurantVerificationStatus.Approved)
                return Conflict("Payout banking details must be verified before approval.");

            if (application.Restaurant != null)
                return Conflict("An operational restaurant profile already exists for this application.");

            var restaurantRole = await _context.Roles
                .FirstOrDefaultAsync(role => role.Name.ToLower() == "restaurant", cancellationToken);
            if (restaurantRole == null)
                return Conflict("The Restaurant role is not configured. Create the Restaurant role before approving applications.");

            var previousStatus = application.Status;
            var now = DateTime.UtcNow;
            var activationDate = DateOnly.FromDateTime(now);
            var restaurant = new Restaurant
            {
                Name = application.TradingName!,
                Description = application.RestaurantCategory ?? string.Empty,
                PhoneNumber = application.RestaurantContactNumber!,
                Email = application.BusinessEmail!,
                Address = $"{application.PhysicalAddress}, {application.City}",
                Latitude = 0m,
                Longitude = 0m,
                IsOpen = false,
                IsApproved = true,
                IsActive = true,
                CreatedAt = now,
                UserId = application.UserId,
                RestaurantApplicationId = application.RestaurantApplicationId
            };

            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync(cancellationToken);

            _context.RestaurantCommissionSettings.Add(new RestaurantCommissionSetting
            {
                RestaurantId = restaurant.RestaurantId,
                ActivationDate = now,
                PromotionStartDate = activationDate,
                PromotionEndDateExclusive = activationDate.AddMonths(3),
                PromotionCommissionRate = 0.0000m,
                CollectionCommissionRate = 0.0800m,
                RestaurantDeliveryCommissionRate = 0.1000m,
                GrubnBiteDeliveryCommissionRate = 0.1500m,
                IsPromotionActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });

            // Restaurant accounts may already receive this role during registration.
            // Reassert it here so role and approved profile remain consistent.
            application.User.RoleId = restaurantRole.RoleId;
            application.User.UpdatedAt = now;

            application.Status = RestaurantApplicationStatus.Approved;
            application.ReviewedByUserId = adminId;
            application.ReviewedAt = now;
            application.UpdatedAt = now;
            application.AdminComments = "Application approved, Restaurant role assigned and operational restaurant profile activated.";

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = previousStatus,
                NewStatus = RestaurantApplicationStatus.Approved,
                Action = "ApplicationApproved",
                Comment = application.AdminComments,
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Ok(new
            {
                application.RestaurantApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString(),
                restaurantId = restaurant.RestaurantId,
                restaurant.Name,
                restaurant.IsApproved,
                restaurant.IsActive,
                role = restaurantRole.Name,
                reauthenticationRequired = true,
                message = "Application approved and restaurant profile activated. The applicant must sign in again to access restaurant features."
            });
        }

        private async Task<IActionResult> ChangeStatus(
            int id,
            RestaurantApplicationStatus newStatus,
            string action,
            string? comment,
            CancellationToken cancellationToken)
        {
            var application = await _context.RestaurantApplications
                .FirstOrDefaultAsync(item => item.RestaurantApplicationId == id, cancellationToken);

            if (application == null) return NotFound("Restaurant application not found.");
            if (application.Status is RestaurantApplicationStatus.Approved
                or RestaurantApplicationStatus.Rejected)
                return Conflict("A completed application cannot be changed.");

            if (newStatus == RestaurantApplicationStatus.UnderVerification &&
                application.Status is not RestaurantApplicationStatus.PendingReview
                and not RestaurantApplicationStatus.UnderVerification)
                return Conflict("Only a submitted application can enter verification.");

            if (newStatus == RestaurantApplicationStatus.DocumentsRequired &&
                application.Status is not RestaurantApplicationStatus.PendingReview
                and not RestaurantApplicationStatus.UnderVerification
                and not RestaurantApplicationStatus.DocumentsRequired)
                return Conflict("Documents can only be requested for an application under review.");

            if (newStatus == RestaurantApplicationStatus.Rejected &&
                application.Status is not RestaurantApplicationStatus.PendingReview
                and not RestaurantApplicationStatus.UnderVerification
                and not RestaurantApplicationStatus.DocumentsRequired)
                return Conflict("Only a submitted application can be rejected.");

            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            var previousStatus = application.Status;
            var now = DateTime.UtcNow;
            application.Status = newStatus;
            application.UpdatedAt = now;
            application.ReviewedByUserId = adminId;
            application.ReviewedAt = now;

            if (newStatus == RestaurantApplicationStatus.DocumentsRequired)
                application.DocumentsRequestedMessage = comment!.Trim();
            else if (newStatus == RestaurantApplicationStatus.Rejected)
                application.RejectionReason = comment!.Trim();
            else if (!string.IsNullOrWhiteSpace(comment))
                application.AdminComments = comment.Trim();

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                Action = action,
                Comment = comment?.Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new
            {
                application.RestaurantApplicationId,
                status = application.Status.ToString(),
                application.UpdatedAt
            });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }

    public class RestaurantApplicationAdminCommentRequest
    {
        [StringLength(2000)]
        public string? Comment { get; set; }
    }

    public class ReviewRestaurantDocumentRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Comment { get; set; }
    }

    public class ReviewRestaurantBankingRequest
    {
        public bool IsApproved { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }
}
