using System.Data;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
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
    public class AdminDriverApplicationController : ControllerBase
    {
        private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);
        private readonly AppDbContext _context;
        private readonly ISupabaseRestaurantDocumentStorageService _documentStorage;
        private readonly IRestaurantBankingEncryptionService _identityEncryption;

        public AdminDriverApplicationController(
            AppDbContext context,
            ISupabaseRestaurantDocumentStorageService documentStorage,
            IRestaurantBankingEncryptionService identityEncryption)
        {
            _context = context;
            _documentStorage = documentStorage;
            _identityEncryption = identityEncryption;
        }

        private int? CurrentAdminId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        [HttpPost("maintenance/encrypt-legacy-identifiers")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> EncryptLegacyIdentityValues(
            [FromQuery] bool confirm = false,
            CancellationToken cancellationToken = default)
        {
            const string requiredMigration = "20261105160000_EncryptDriverIdentityFields";
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync(cancellationToken);
            if (!appliedMigrations.Contains(requiredMigration, StringComparer.Ordinal))
                return Conflict("Apply the driver identity encryption schema migration before running this maintenance operation.");

            if (confirm)
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable, cancellationToken);

                var applications = await _context.DriverApplications
                    .Where(application =>
                        application.IdOrPassportNumber != null ||
                        application.SignatureIdOrPassportNumber != null ||
                        application.AccountHolderIdOrRegistrationNumber != null ||
                        application.IdOrPassportNumberEncrypted != null ||
                        application.SignatureIdOrPassportNumberEncrypted != null ||
                        application.AccountHolderIdOrRegistrationNumberEncrypted != null)
                    .ToListAsync(cancellationToken);

                var encryptedFieldCount = 0;
                var updatedApplicationCount = 0;
                var now = DateTime.UtcNow;
                var adminId = CurrentAdminId();

                foreach (var application in applications)
                {
                    var changed = false;

                    if (!string.IsNullOrWhiteSpace(application.IdOrPassportNumberEncrypted))
                        _identityEncryption.Decrypt(application.IdOrPassportNumberEncrypted);
                    else if (!string.IsNullOrWhiteSpace(application.IdOrPassportNumber))
                    {
                        application.IdOrPassportNumberEncrypted =
                            _identityEncryption.Encrypt(application.IdOrPassportNumber.Trim());
                        encryptedFieldCount++;
                        changed = true;
                    }

                    if (!string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumberEncrypted))
                        _identityEncryption.Decrypt(application.SignatureIdOrPassportNumberEncrypted);
                    else if (!string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumber))
                    {
                        application.SignatureIdOrPassportNumberEncrypted =
                            _identityEncryption.Encrypt(application.SignatureIdOrPassportNumber.Trim());
                        encryptedFieldCount++;
                        changed = true;
                    }

                    if (!string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumberEncrypted))
                        _identityEncryption.Decrypt(application.AccountHolderIdOrRegistrationNumberEncrypted);
                    else if (!string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumber))
                    {
                        application.AccountHolderIdOrRegistrationNumberEncrypted =
                            _identityEncryption.Encrypt(application.AccountHolderIdOrRegistrationNumber.Trim());
                        encryptedFieldCount++;
                        changed = true;
                    }

                    if (!string.IsNullOrWhiteSpace(application.IdOrPassportNumberEncrypted) &&
                        application.IdOrPassportNumber != null)
                    {
                        application.IdOrPassportNumber = null;
                        changed = true;
                    }

                    if (!string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumberEncrypted) &&
                        application.SignatureIdOrPassportNumber != null)
                    {
                        application.SignatureIdOrPassportNumber = null;
                        changed = true;
                    }

                    if (!string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumberEncrypted) &&
                        application.AccountHolderIdOrRegistrationNumber != null)
                    {
                        application.AccountHolderIdOrRegistrationNumber = null;
                        changed = true;
                    }

                    if (changed)
                    {
                        application.UpdatedAt = now;
                        updatedApplicationCount++;

                        _context.DriverApplicationHistories.Add(new DriverApplicationHistory
                        {
                            DriverApplicationId = application.DriverApplicationId,
                            PreviousStatus = application.Status,
                            NewStatus = application.Status,
                            Action = "IdentityDataEncrypted",
                            Comment = "Legacy driver identity fields encrypted at rest during a controlled maintenance operation.",
                            PerformedByUserId = adminId,
                            CreatedAt = now
                        });
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return Ok(new
                {
                    dryRun = false,
                    updatedApplicationCount,
                    encryptedFieldCount,
                    message = "Legacy driver identity values were encrypted and plaintext copies cleared."
                });
            }

            var candidates = await _context.DriverApplications
                .AsNoTracking()
                .Where(application =>
                    application.IdOrPassportNumber != null ||
                    application.SignatureIdOrPassportNumber != null ||
                    application.AccountHolderIdOrRegistrationNumber != null ||
                    application.IdOrPassportNumberEncrypted != null ||
                    application.SignatureIdOrPassportNumberEncrypted != null ||
                    application.AccountHolderIdOrRegistrationNumberEncrypted != null)
                .ToListAsync(cancellationToken);

            var pendingFields = candidates.Sum(application =>
                (string.IsNullOrWhiteSpace(application.IdOrPassportNumberEncrypted) &&
                 !string.IsNullOrWhiteSpace(application.IdOrPassportNumber) ? 1 : 0) +
                (string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumberEncrypted) &&
                 !string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumber) ? 1 : 0) +
                (string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumberEncrypted) &&
                 !string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumber) ? 1 : 0));

            return Ok(new
            {
                dryRun = true,
                applicationsChecked = candidates.Count,
                applicationsWithLegacyIdentityData = candidates.Count(application =>
                    !string.IsNullOrWhiteSpace(application.IdOrPassportNumber) ||
                    !string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumber) ||
                    !string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumber)),
                pendingFields,
                message = "No data was changed. Repeat with confirm=true only after reviewing this result."
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetApplications(
            [FromQuery] DriverApplicationStatus? status,
            CancellationToken cancellationToken)
        {
            var query = _context.DriverApplications
                .AsNoTracking()
                .Include(application => application.User)
                .AsQueryable();

            // Drafts belong to the applicant and must never appear in the
            // administrator review queue, even if a Draft status is requested.
            query = query.Where(application => application.Status != DriverApplicationStatus.Draft);

            if (status.HasValue)
                query = query.Where(application => application.Status == status.Value);

            var applications = await query
                .OrderByDescending(application => application.SubmittedAt ?? application.UpdatedAt)
                .Select(application => new
                {
                    application.DriverApplicationId,
                    application.ApplicationReference,
                    status = application.Status.ToString(),
                    applicantName = application.User.FirstName + " " + application.User.LastName,
                    applicantEmail = application.User.Email,
                    applicantPhone = application.User.PhoneNumber,
                    applicantEmailVerified = application.User.IsEmailVerified,
                    application.PartnerType,
                    application.ApplyingAs,
                    application.VehicleType,
                    application.VehicleRegistration,
                    application.SubmittedAt,
                    application.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return Ok(applications);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetApplication(int id, CancellationToken cancellationToken)
        {
            var application = await _context.DriverApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.DriverApplicationId == id, cancellationToken);

            if (application == null || application.Status == DriverApplicationStatus.Draft)
                return NotFound("Submitted driver application not found.");

            var applicant = await _context.Users
                .AsNoTracking()
                .Where(user => user.UserId == application.UserId)
                .Select(user => new
                {
                    user.UserId,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.PhoneNumber,
                    user.IsEmailVerified
                })
                .FirstAsync(cancellationToken);

            var documents = new List<object>();
            var storedDocuments = await _context.DriverApplicationDocuments
                .AsNoTracking()
                .Where(document => document.DriverApplicationId == id)
                .OrderBy(document => document.UploadedAt)
                .ToListAsync(cancellationToken);

            foreach (var document in storedDocuments)
            {
                documents.Add(new
                {
                    document.DriverApplicationDocumentId,
                    document.DocumentType,
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

            var json = JsonSerializer.SerializeToNode(application, WebJson)!.AsObject();
            json.Remove("accountNumberEncrypted");
            // Identity and signature identifiers are sensitive personal information.
            // Administrators verify the supporting private documents; the API
            // must not disclose the raw numbers in the application payload.
            json.Remove("idOrPassportNumber");
            json.Remove("signatureIdOrPassportNumber");
            json.Remove("accountHolderIdOrRegistrationNumber");
            json.Remove("idOrPassportNumberEncrypted");
            json.Remove("signatureIdOrPassportNumberEncrypted");
            json.Remove("accountHolderIdOrRegistrationNumberEncrypted");
            json["identityNumberOnFile"] = !string.IsNullOrWhiteSpace(application.IdOrPassportNumberEncrypted) || !string.IsNullOrWhiteSpace(application.IdOrPassportNumber);
            json["signatureIdentityNumberOnFile"] = !string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumberEncrypted) || !string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumber);
            json["accountHolderIdentityNumberOnFile"] = !string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumberEncrypted) || !string.IsNullOrWhiteSpace(application.AccountHolderIdOrRegistrationNumber);
            json.Remove("user");
            json.Remove("reviewedByUser");
            json.Remove("documents");
            json.Remove("history");
            json["status"] = JsonValue.Create(application.Status.ToString());
            json["maskedAccountNumber"] = string.IsNullOrWhiteSpace(application.AccountNumberEncrypted)
                ? null
                : "Encrypted account on file";
            json["applicant"] = JsonSerializer.SerializeToNode(applicant, WebJson);
            json["documents"] = JsonSerializer.SerializeToNode(documents, WebJson);

            return Ok(json);
        }

        [HttpPut("{id:int}/documents/{documentId:int}/review")]
        public async Task<IActionResult> ReviewDocument(
            int id,
            int documentId,
            [FromBody] ReviewDriverDocumentRequest request,
            CancellationToken cancellationToken)
        {
            if (!Enum.TryParse<DriverVerificationStatus>(request.Status, true, out var status) ||
                status is not DriverVerificationStatus.Approved and not DriverVerificationStatus.Rejected)
                return BadRequest("Document status must be Approved or Rejected.");

            if (status == DriverVerificationStatus.Rejected && string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("A comment is required when rejecting a document.");

            var document = await _context.DriverApplicationDocuments
                .Include(item => item.DriverApplication)
                .FirstOrDefaultAsync(item =>
                    item.DriverApplicationDocumentId == documentId &&
                    item.DriverApplicationId == id,
                    cancellationToken);

            if (document == null) return NotFound("Application document not found.");
            if (document.DriverApplication.Status == DriverApplicationStatus.Draft)
                return Conflict("Documents can only be reviewed after the applicant submits the application.");
            if (document.DriverApplication.Status is DriverApplicationStatus.Approved or DriverApplicationStatus.Rejected)
                return Conflict("A completed application cannot be changed.");

            var adminId = CurrentAdminId();
            if (adminId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            document.VerificationStatus = status;
            document.AdminComment = request.Comment?.Trim();
            document.VerifiedByUserId = adminId;
            document.VerifiedAt = now;
            document.DriverApplication.UpdatedAt = now;

            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = id,
                PreviousStatus = document.DriverApplication.Status,
                NewStatus = document.DriverApplication.Status,
                Action = "DocumentReviewed",
                Comment = $"{document.DocumentType} document marked {status}. {request.Comment}".Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new
            {
                document.DriverApplicationDocumentId,
                status = status.ToString(),
                document.AdminComment
            });
        }

        [HttpPut("{id:int}/request-documents")]
        public async Task<IActionResult> RequestDocuments(
            int id,
            [FromBody] DriverApplicationAdminCommentRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("A message explaining the required documents is required.");

            return await ChangeStatus(
                id, DriverApplicationStatus.DocumentsRequired,
                "DocumentsRequested", request.Comment, cancellationToken);
        }

        [HttpPut("{id:int}/under-verification")]
        public async Task<IActionResult> MarkUnderVerification(
            int id,
            [FromBody] DriverApplicationAdminCommentRequest request,
            CancellationToken cancellationToken)
        {
            return await ChangeStatus(
                id, DriverApplicationStatus.UnderVerification,
                "VerificationStarted", request.Comment, cancellationToken);
        }

        [HttpPut("{id:int}/reject")]
        public async Task<IActionResult> RejectApplication(
            int id,
            [FromBody] DriverApplicationAdminCommentRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
                return BadRequest("A rejection reason is required.");

            var application = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.DriverApplicationId == id, cancellationToken);
            if (application == null) return NotFound("Driver application not found.");
            if (application.Status == DriverApplicationStatus.Draft)
                return Conflict("A draft application cannot be rejected before submission.");
            if (application.Status == DriverApplicationStatus.Approved)
                return Conflict("An approved application cannot be rejected.");

            var adminId = CurrentAdminId();
            if (adminId == null) return Unauthorized();

            var previousStatus = application.Status;
            var now = DateTime.UtcNow;
            application.Status = DriverApplicationStatus.Rejected;
            application.RejectionReason = request.Comment.Trim();
            application.ReviewedByUserId = adminId;
            application.ReviewedAt = now;
            application.UpdatedAt = now;
            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = id,
                PreviousStatus = previousStatus,
                NewStatus = application.Status,
                Action = "ApplicationRejected",
                Comment = request.Comment.Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });
            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Driver application rejected.", status = application.Status.ToString() });
        }

        [HttpPut("{id:int}/approve")]
        public async Task<IActionResult> ApproveApplication(int id, CancellationToken cancellationToken)
        {
            var application = await _context.DriverApplications
                .Include(item => item.Documents)
                .Include(item => item.User)
                .FirstOrDefaultAsync(item => item.DriverApplicationId == id, cancellationToken);

            if (application == null) return NotFound("Driver application not found.");
            if (!application.User.IsActive)
                return Conflict("An inactive user account cannot be approved as a delivery partner.");
            if (!application.User.IsEmailVerified)
                return Conflict("The applicant must verify their email address before approval.");
            if (application.Status is DriverApplicationStatus.Approved or DriverApplicationStatus.Rejected)
                return Conflict("This application has already been completed.");
            if (application.Status is not DriverApplicationStatus.PendingReview and not DriverApplicationStatus.UnderVerification)
                return Conflict("Only submitted applications under review can be approved.");

            var missingApplicationItems = DriverApplicationController.GetMissingItems(application);
            if (missingApplicationItems.Count > 0)
                return BadRequest(new
                {
                    message = "The application is missing required information or supporting documents.",
                    missingItems = missingApplicationItems
                });

            var unreviewedDocuments = application.Documents
                .Where(document => document.VerificationStatus != DriverVerificationStatus.Approved)
                .Select(document => document.DocumentType)
                .Distinct()
                .ToList();
            if (unreviewedDocuments.Count > 0)
                return BadRequest(new
                {
                    message = "Review and approve every uploaded document before approving the application.",
                    documentsToReview = unreviewedDocuments
                });

            var isBicycle = application.PartnerType?.Contains("bicycle", StringComparison.OrdinalIgnoreCase) == true;
            if (!isBicycle)
            {
                if (application.IsLicensed != true || application.IsInsured != true)
                    return BadRequest("The vehicle must be confirmed as licensed and insured before approval.");
                if (!string.Equals(application.CommercialDeliveryInsurance, "Yes", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Commercial delivery insurance must be confirmed before approval.");
                if (application.RequiresRoadworthiness && application.IsRoadworthy != true)
                    return BadRequest("Roadworthiness must be confirmed before approval.");
            }

            var adminId = CurrentAdminId();
            if (adminId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(item => item.UserId == application.UserId, cancellationToken);

            if (driver == null)
            {
                driver = new Driver
                {
                    UserId = application.UserId,
                    VehicleType = application.VehicleType ?? application.PartnerType ?? "Other",
                    VehicleRegistration = application.VehicleRegistration ?? "N/A",
                    IsOnline = false,
                    IsApproved = true,
                    CreatedAt = now
                };
                _context.Drivers.Add(driver);
            }
            else
            {
                driver.VehicleType = application.VehicleType ?? application.PartnerType ?? driver.VehicleType;
                driver.VehicleRegistration = application.VehicleRegistration ?? "N/A";
                driver.IsOnline = false;
                driver.IsApproved = true;
            }

            var previousStatus = application.Status;
            application.Status = DriverApplicationStatus.Approved;
            application.ReviewedByUserId = adminId;
            application.ReviewedAt = now;
            application.UpdatedAt = now;

            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = id,
                PreviousStatus = previousStatus,
                NewStatus = application.Status,
                Action = "ApplicationApproved",
                Comment = "Delivery partner application approved and driver profile activated.",
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new
            {
                message = "Driver application approved. The driver profile is now active.",
                application.DriverApplicationId,
                status = application.Status.ToString(),
                driverId = driver.DriverId
            });
        }

        private async Task<IActionResult> ChangeStatus(
            int id,
            DriverApplicationStatus newStatus,
            string action,
            string? comment,
            CancellationToken cancellationToken)
        {
            var application = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.DriverApplicationId == id, cancellationToken);
            if (application == null) return NotFound("Driver application not found.");
            if (application.Status == DriverApplicationStatus.Draft)
                return Conflict("A draft application cannot be moved into review before submission.");
            if (application.Status is DriverApplicationStatus.Approved or DriverApplicationStatus.Rejected)
                return Conflict("A completed application cannot be changed.");

            var adminId = CurrentAdminId();
            if (adminId == null) return Unauthorized();

            var previousStatus = application.Status;
            var now = DateTime.UtcNow;
            application.Status = newStatus;
            application.DocumentsRequestedMessage = newStatus == DriverApplicationStatus.DocumentsRequired
                ? comment?.Trim()
                : null;
            application.AdminComments = comment?.Trim();
            application.ReviewedByUserId = adminId;
            application.ReviewedAt = now;
            application.UpdatedAt = now;

            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = id,
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                Action = action,
                Comment = comment?.Trim(),
                PerformedByUserId = adminId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Driver application updated.", status = application.Status.ToString() });
        }
    }

    public sealed class DriverApplicationAdminCommentRequest
    {
        public string? Comment { get; set; }
    }

    public sealed class ReviewDriverDocumentRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Comment { get; set; }
    }
}