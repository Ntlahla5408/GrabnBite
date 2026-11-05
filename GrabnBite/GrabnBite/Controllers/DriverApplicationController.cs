using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using GrabnBite.Configuration;
using GrabnBite.Data;
using GrabnBite.DTOs.Driver;
using GrabnBite.Models.Entities;
using GrabnBite.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Driver")]
    public class DriverApplicationController : ControllerBase
    {
        private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);
        private static readonly HashSet<string> AllowedDocumentTypes = new(StringComparer.Ordinal)
        {
            "IdentityDocument", "ProofOfAddress", "ProfilePhotograph",
            "DriversLicence", "ProfessionalDrivingPermit", "BusinessRegistration",
            "VehicleRegistrationCertificate", "VehicleLicence",
            "RoadworthinessCertificate", "ProofOfInsurance",
            "ThirdPartyVehiclePermission", "BankConfirmation", "Other"
        };

        private readonly AppDbContext _context;
        private readonly ISupabaseRestaurantDocumentStorageService _documentStorage;
        private readonly SupabaseRestaurantDocumentStorageSettings _storageSettings;
        private readonly IRestaurantBankingEncryptionService _bankingEncryption;

        public DriverApplicationController(
            AppDbContext context,
            ISupabaseRestaurantDocumentStorageService documentStorage,
            IOptions<SupabaseRestaurantDocumentStorageSettings> storageSettings,
            IRestaurantBankingEncryptionService bankingEncryption)
        {
            _context = context;
            _documentStorage = documentStorage;
            _storageSettings = storageSettings.Value;
            _bankingEncryption = bankingEncryption;
        }

        private int? CurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrGetApplication(CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var existing = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);
            if (existing != null)
                return Ok(new
                {
                    existing.DriverApplicationId,
                    existing.ApplicationReference,
                    status = existing.Status.ToString()
                });

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);
            if (user == null) return NotFound("User account not found.");

            var now = DateTime.UtcNow;
            var application = new DriverApplication
            {
                UserId = userId.Value,
                ApplicationReference = $"GBD-{Guid.NewGuid().ToString("N")[..20].ToUpperInvariant()}",
                Status = DriverApplicationStatus.Draft,
                FullLegalName = $"{user.FirstName} {user.LastName}",
                Surname = user.LastName,
                MobileNumber = user.PhoneNumber,
                EmailAddress = user.Email,
                SignatureFullLegalName = $"{user.FirstName} {user.LastName}",
                SignatureEmailAddress = user.Email,
                SignatureMobileNumber = user.PhoneNumber,
                SignatureMethod = "EmailVerification",
                CreatedAt = now,
                UpdatedAt = now
            };

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            _context.DriverApplications.Add(application);
            await _context.SaveChangesAsync(cancellationToken);
            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = application.DriverApplicationId,
                PreviousStatus = null,
                NewStatus = DriverApplicationStatus.Draft,
                Action = "ApplicationCreated",
                Comment = "Delivery partner application draft created for an existing driver account.",
                PerformedByUserId = userId,
                CreatedAt = now
            });
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Ok(new
            {
                application.DriverApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString()
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyApplication(CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var application = await _context.DriverApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);

            if (application == null) return NotFound("Driver application not found.");

            var documents = await _context.DriverApplicationDocuments
                .AsNoTracking()
                .Where(document => document.DriverApplicationId == application.DriverApplicationId)
                .OrderBy(document => document.UploadedAt)
                .Select(document => new
                {
                    document.DriverApplicationDocumentId,
                    document.DocumentType,
                    document.DocumentDescription,
                    document.OriginalFileName,
                    document.ContentType,
                    document.FileSize,
                    verificationStatus = document.VerificationStatus.ToString(),
                    document.AdminComment,
                    document.UploadedAt
                })
                .ToListAsync(cancellationToken);

            return Ok(ToApplicationJson(application, documents));
        }

        [HttpPut("draft")]
        public async Task<IActionResult> SaveDraft(
            [FromBody] SaveDriverApplicationDto request,
            CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var application = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);

            if (application == null) return NotFound("Driver application not found.");
            if (application.Status is not DriverApplicationStatus.Draft
                and not DriverApplicationStatus.DocumentsRequired)
                return Conflict("This application is no longer editable.");

            foreach (var sourceProperty in typeof(SaveDriverApplicationDto).GetProperties(BindingFlags.Instance | BindingFlags.Public))
            {
                var targetProperty = typeof(DriverApplication).GetProperty(sourceProperty.Name);
                if (targetProperty == null || !targetProperty.CanWrite) continue;
                if (sourceProperty.Name == "BankAccountNumber") continue;
                targetProperty.SetValue(application, sourceProperty.GetValue(request));
            }

            if (!string.IsNullOrWhiteSpace(request.BankAccountNumber))
                application.AccountNumberEncrypted = _bankingEncryption.Encrypt(request.BankAccountNumber.Trim());

            application.SignatureMethod = "EmailVerification";
            application.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var documents = await _context.DriverApplicationDocuments
                .AsNoTracking()
                .Where(document => document.DriverApplicationId == application.DriverApplicationId)
                .OrderBy(document => document.UploadedAt)
                .Select(document => new
                {
                    document.DriverApplicationDocumentId,
                    document.DocumentType,
                    document.DocumentDescription,
                    document.OriginalFileName,
                    document.ContentType,
                    document.FileSize,
                    verificationStatus = document.VerificationStatus.ToString(),
                    document.AdminComment,
                    document.UploadedAt
                })
                .ToListAsync(cancellationToken);

            var response = ToApplicationJson(application, documents);
            response["message"] = JsonValue.Create("Driver application draft saved.");
            return Ok(response);
        }

        [HttpPost("documents")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument(
            [FromForm] string documentType,
            [FromForm] string? description,
            [FromForm] IFormFile? file,
            CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var application = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);

            if (application == null) return NotFound("Driver application not found.");
            if (application.Status is not DriverApplicationStatus.Draft
                and not DriverApplicationStatus.DocumentsRequired)
                return Conflict("Documents can only be uploaded while the application is editable.");
            if (!AllowedDocumentTypes.Contains(documentType))
                return BadRequest("Select a valid driver document type.");
            if (file == null || file.Length == 0)
                return BadRequest("Select a document to upload.");

            var maximumFileSize = _storageSettings.MaxFileSizeBytes > 0
                ? _storageSettings.MaxFileSizeBytes
                : 10 * 1024 * 1024;
            if (file.Length > maximumFileSize)
                return BadRequest($"The document exceeds the maximum size of {maximumFileSize / (1024 * 1024)} MB.");

            var contentType = file.ContentType?.ToLowerInvariant();
            if (contentType is not ("application/pdf" or "image/jpeg" or "image/png" or "image/webp"))
                return BadRequest("Only PDF, JPEG, PNG and WebP documents are supported.");
            if (documentType == "ProfilePhotograph" &&
                contentType is not ("image/jpeg" or "image/png" or "image/webp"))
                return BadRequest("A profile photograph must be a JPEG, PNG or WebP image.");

            await using var stream = file.OpenReadStream();
            var header = new byte[12];
            var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
            var isPdf = bytesRead >= 5 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46 && header[4] == 0x2D;
            var isJpeg = bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
            var isPng = bytesRead >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A;
            var isWebp = bytesRead >= 12 && header[0] == (byte)'R' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F' && header[8] == (byte)'W' && header[9] == (byte)'E' && header[10] == (byte)'B' && header[11] == (byte)'P';
            var validSignature = (contentType == "application/pdf" && isPdf) ||
                (contentType == "image/jpeg" && isJpeg) ||
                (contentType == "image/png" && isPng) ||
                (contentType == "image/webp" && isWebp);
            if (!validSignature) return BadRequest("The file contents do not match the selected document type.");

            stream.Position = 0;
            var extension = contentType switch
            {
                "application/pdf" => ".pdf",
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".bin"
            };
            var storagePath = $"driver-applications/{application.DriverApplicationId}/{Guid.NewGuid():N}{extension}";
            var originalFileName = Path.GetFileName(file.FileName.Replace('\\', '/'));
            if (originalFileName.Length > 255) originalFileName = originalFileName[^255..];

            await _documentStorage.UploadAsync(stream, storagePath, contentType!, cancellationToken);

            var document = new DriverApplicationDocument
            {
                DriverApplicationId = application.DriverApplicationId,
                DocumentType = documentType,
                DocumentDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                StoragePath = storagePath,
                OriginalFileName = originalFileName,
                ContentType = contentType!,
                FileSize = file.Length,
                VerificationStatus = DriverVerificationStatus.Pending,
                UploadedAt = DateTime.UtcNow
            };

            try
            {
                _context.DriverApplicationDocuments.Add(document);
                application.UpdatedAt = DateTime.UtcNow;
                _context.DriverApplicationHistories.Add(new DriverApplicationHistory
                {
                    DriverApplicationId = application.DriverApplicationId,
                    PreviousStatus = application.Status,
                    NewStatus = application.Status,
                    Action = "DocumentUploaded",
                    Comment = $"Applicant uploaded {documentType}.",
                    PerformedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // The private object was uploaded before its database record.
                // Compensate so a failed DB write does not leave an orphaned file.
                try
                {
                    await _documentStorage.DeleteAsync(storagePath, CancellationToken.None);
                }
                catch
                {
                    // Preserve the original database exception. A failed cleanup
                    // may leave an orphan for storage reconciliation.
                }

                throw;
            }

            return Ok(new
            {
                document.DriverApplicationDocumentId,
                document.DocumentType,
                document.OriginalFileName,
                verificationStatus = document.VerificationStatus.ToString()
            });
        }

        [HttpGet("documents/{documentId:int}/download")]
        public async Task<IActionResult> DownloadDocument(int documentId, CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var document = await _context.DriverApplicationDocuments
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.DriverApplicationDocumentId == documentId &&
                    item.DriverApplication.UserId == userId.Value,
                    cancellationToken);

            if (document == null) return NotFound("Document not found.");

            var signedUrl = await _documentStorage.CreateSignedUrlAsync(document.StoragePath, 900, cancellationToken);
            return Ok(new
            {
                document.DriverApplicationDocumentId,
                document.OriginalFileName,
                document.ContentType,
                signedUrl,
                expiresInSeconds = 900
            });
        }

        [HttpDelete("documents/{documentId:int}")]
        public async Task<IActionResult> DeleteDocument(int documentId, CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var application = await _context.DriverApplications
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);
            if (application == null) return NotFound("Driver application not found.");
            if (application.Status is not DriverApplicationStatus.Draft
                and not DriverApplicationStatus.DocumentsRequired)
                return Conflict("Documents can only be changed while the application is editable.");

            var document = await _context.DriverApplicationDocuments
                .FirstOrDefaultAsync(item =>
                    item.DriverApplicationDocumentId == documentId &&
                    item.DriverApplicationId == application.DriverApplicationId,
                    cancellationToken);
            if (document == null) return NotFound("Document not found.");
            if (document.VerificationStatus != DriverVerificationStatus.Pending)
                return Conflict("A document that has been reviewed cannot be deleted.");

            await _documentStorage.DeleteAsync(document.StoragePath, cancellationToken);
            _context.DriverApplicationDocuments.Remove(document);
            application.UpdatedAt = DateTime.UtcNow;
            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = application.DriverApplicationId,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "DocumentDeleted",
                Comment = $"Applicant removed {document.DocumentType}.",
                PerformedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(cancellationToken);
            return NoContent();
        }

        [HttpPost("submit")]
        public async Task<IActionResult> Submit(CancellationToken cancellationToken)
        {
            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();

            var application = await _context.DriverApplications
                .Include(item => item.User)
                .Include(item => item.Documents)
                .FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);
            if (application == null) return NotFound("Driver application not found.");
            if (application.Status is not DriverApplicationStatus.Draft
                and not DriverApplicationStatus.DocumentsRequired)
                return Conflict("This application has already been submitted or completed.");

            var missing = GetMissingItems(application);
            var currentPolicies = await _context.PolicyDocuments
                .AsNoTracking()
                .Where(policy =>
                    !policy.IsArchived &&
                    policy.Status == "Published" &&
                    (policy.EffectiveDate == null || policy.EffectiveDate <= DateTime.UtcNow))
                .OrderBy(policy => policy.Title)
                .Select(policy => new
                {
                    policy.PolicyDocumentId,
                    policy.Title,
                    policy.Version
                })
                .ToListAsync(cancellationToken);

            List<PolicyAcknowledgement> acknowledgedPolicies;
            try
            {
                acknowledgedPolicies = string.IsNullOrWhiteSpace(application.PolicyVersionsOrLinks)
                    ? new List<PolicyAcknowledgement>()
                    : JsonSerializer.Deserialize<List<PolicyAcknowledgement>>(application.PolicyVersionsOrLinks, WebJson)
                        ?? new List<PolicyAcknowledgement>();
            }
            catch (JsonException)
            {
                acknowledgedPolicies = new List<PolicyAcknowledgement>();
            }

            var acknowledgedPolicyVersions = acknowledgedPolicies.GroupBy(item => item.PolicyDocumentId).ToDictionary(group => group.Key, group => group.Last().Version);

            var acceptedPolicies = new List<PolicyAcknowledgement>();
            foreach (var policy in currentPolicies)
            {
                if (!acknowledgedPolicyVersions.TryGetValue(policy.PolicyDocumentId, out var acknowledgedVersion) ||
                    acknowledgedVersion != policy.Version)
                {
                    missing.Add($"Read and acknowledge the current version of: {policy.Title}");
                    continue;
                }

                acceptedPolicies.Add(new PolicyAcknowledgement
                {
                    PolicyDocumentId = policy.PolicyDocumentId,
                    Title = policy.Title,
                    Version = policy.Version
                });
            }

            if (missing.Count > 0)
                return BadRequest(new { message = "Complete the required application details and acknowledge all current policies before submitting.", missingItems = missing });

            application.PolicyVersionsOrLinks = JsonSerializer.Serialize(acceptedPolicies, WebJson);
            application.SignatureMethod = "EmailVerification";

            if (!application.User.IsEmailVerified)
                return BadRequest("Verify your email address before signing and submitting the application.");

            var previousStatus = application.Status;
            var now = DateTime.UtcNow;
            application.Status = DriverApplicationStatus.PendingReview;
            application.SubmittedAt = now;
            application.AcceptedAt = now;
            application.UpdatedAt = now;
            application.RejectionReason = null;
            application.DocumentsRequestedMessage = null;

            _context.DriverApplicationHistories.Add(new DriverApplicationHistory
            {
                DriverApplicationId = application.DriverApplicationId,
                PreviousStatus = previousStatus,
                NewStatus = DriverApplicationStatus.PendingReview,
                Action = "ApplicationSubmitted",
                Comment = "Applicant submitted the delivery partner application for review.",
                PerformedByUserId = userId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new
            {
                application.DriverApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString(),
                message = "Your delivery partner application has been submitted and is awaiting administrator review."
            });
        }

        private sealed class PolicyAcknowledgement
        {
            public int PolicyDocumentId { get; set; }
            public string Title { get; set; } = string.Empty;
            public int Version { get; set; }
        }

        internal static List<string> GetMissingItems(DriverApplication application)
        {
            var missing = new List<string>();
            void Require(bool condition, string label) { if (!condition) missing.Add(label); }

            Require(!string.IsNullOrWhiteSpace(application.FullLegalName), "Full legal name");
            Require(!string.IsNullOrWhiteSpace(application.Surname), "Surname");
            Require(!string.IsNullOrWhiteSpace(application.IdOrPassportNumber), "South African ID or passport number");
            Require(application.DateOfBirth.HasValue, "Date of birth");
            Require(!string.IsNullOrWhiteSpace(application.Nationality), "Nationality");
            Require(!string.IsNullOrWhiteSpace(application.MobileNumber), "Mobile number");
            Require(!string.IsNullOrWhiteSpace(application.EmailAddress), "Email address");
            Require(!string.IsNullOrWhiteSpace(application.ResidentialAddress), "Residential address");
            Require(!string.IsNullOrWhiteSpace(application.CityOrTown), "City or town");
            Require(!string.IsNullOrWhiteSpace(application.Province), "Province");
            Require(!string.IsNullOrWhiteSpace(application.PartnerType), "Delivery partner type");
            Require(!string.IsNullOrWhiteSpace(application.ApplyingAs), "Applying as");
            Require(!string.IsNullOrWhiteSpace(application.VehicleType), "Vehicle type");
            Require(!string.IsNullOrWhiteSpace(application.VehicleOwner), "Vehicle owner");
            Require(!string.IsNullOrWhiteSpace(application.EmergencyContactName), "Emergency contact");
            Require(!string.IsNullOrWhiteSpace(application.EmergencyContactNumber), "Emergency contact number");
            Require(!string.IsNullOrWhiteSpace(application.AccountHolderName), "Bank account holder");
            Require(!string.IsNullOrWhiteSpace(application.BankName), "Bank name");
            Require(!string.IsNullOrWhiteSpace(application.AccountNumberEncrypted), "Bank account number");
            Require(!string.IsNullOrWhiteSpace(application.AccountType), "Bank account type");
            Require(!string.IsNullOrWhiteSpace(application.BranchCode), "Branch code");
            Require(!string.IsNullOrWhiteSpace(application.SignatureFullLegalName), "Electronic signature name");
            Require(!string.IsNullOrWhiteSpace(application.SignatureIdOrPassportNumber), "Electronic signature ID/passport number");
            Require(!string.IsNullOrWhiteSpace(application.SignatureEmailAddress), "Electronic signature email");
            Require(!string.IsNullOrWhiteSpace(application.SignatureMobileNumber), "Electronic signature mobile number");
            Require(string.Equals(application.SignatureMethod, "EmailVerification", StringComparison.OrdinalIgnoreCase), "Email-verified electronic signature");

            Require(application.AcknowledgedDeliveryPartnerAgreement, "Delivery Partner Agreement acknowledgement");
            Require(application.AcknowledgedCollectionProcedures, "Delivery and Collection Procedures acknowledgement");
            Require(application.AcknowledgedCodeOfConduct, "Delivery Partner Code of Conduct acknowledgement");
            Require(application.AcknowledgedFailedDeliveryPolicy, "Failed and Delayed Delivery Policy acknowledgement");
            Require(application.AcknowledgedAccidentAndLiabilityPolicy, "Accident, Damage and Liability Policy acknowledgement");
            Require(application.AcknowledgedPaymentSchedule, "Delivery Partner Payment Schedule acknowledgement");
            Require(application.ConfirmedInformationAccurate, "Accuracy declaration");
            Require(application.ConfirmedDocumentAuthority, "Document authority declaration");
            Require(application.ConsentedToVerification, "Verification consent");
            Require(application.ConfirmedLegalCompliance, "Legal compliance declaration");
            Require(application.AcknowledgedNoGuaranteedAcceptance, "No guaranteed acceptance acknowledgement");
            Require(application.AcceptedPlatformPolicies, "Platform policies acceptance");
            Require(application.AcknowledgedCompensationSeparation, "Compensation separation acknowledgement");
            Require(application.AcknowledgedWorkingRelationship, "Working relationship acknowledgement");
            Require(application.ConsentedToPersonalInformationProcessing, "Personal information processing consent");
            Require(application.AcknowledgedPopia, "POPIA acknowledgement");

            var documentTypes = application.Documents.Select(item => item.DocumentType).ToHashSet(StringComparer.Ordinal);
            void RequireDocument(string type, string label) { if (!documentTypes.Contains(type)) missing.Add(label); }

            RequireDocument("IdentityDocument", "Certified ID or passport");
            RequireDocument("ProofOfAddress", "Proof of residential address");
            RequireDocument("ProfilePhotograph", "Recent profile photograph");
            RequireDocument("BankConfirmation", "Bank confirmation letter or statement");

            var isBicycle = application.PartnerType?.Contains("bicycle", StringComparison.OrdinalIgnoreCase) == true;
            if (!isBicycle)
            {
                Require(!string.IsNullOrWhiteSpace(application.VehicleMake), "Vehicle make");
                Require(!string.IsNullOrWhiteSpace(application.VehicleModel), "Vehicle model");
                Require(application.VehicleYear.HasValue, "Vehicle year");
                Require(!string.IsNullOrWhiteSpace(application.VehicleRegistration), "Vehicle registration number");
                Require(!string.IsNullOrWhiteSpace(application.VehicleColour), "Vehicle colour");
                RequireDocument("VehicleRegistrationCertificate", "Vehicle registration certificate");
                RequireDocument("VehicleLicence", "Valid vehicle licence documentation");
                RequireDocument("ProofOfInsurance", "Proof of vehicle insurance");
                RequireDocument("DriversLicence", "Valid driver's licence");
                if (application.RequiresProfessionalDrivingPermit)
                    RequireDocument("ProfessionalDrivingPermit", "Professional driving permit");
                if (application.RequiresRoadworthiness)
                    RequireDocument("RoadworthinessCertificate", "Roadworthiness documentation");
                if (application.VehicleOwnedByApplicant == false)
                    RequireDocument("ThirdPartyVehiclePermission", "Permission to use the vehicle");
            }

            if (!string.Equals(application.ApplyingAs, "Individual", StringComparison.OrdinalIgnoreCase))
                RequireDocument("BusinessRegistration", "Business registration documents");

            return missing;
        }

        private static JsonObject ToApplicationJson(
            DriverApplication application,
            IEnumerable<object> documents)
        {
            var json = JsonSerializer.SerializeToNode(application, WebJson)!.AsObject();
            json.Remove("accountNumberEncrypted");
            json.Remove("user");
            json.Remove("reviewedByUser");
            json.Remove("documents");
            json.Remove("history");
            json["status"] = JsonValue.Create(application.Status.ToString());
            json["maskedAccountNumber"] = string.IsNullOrWhiteSpace(application.AccountNumberEncrypted)
                ? null
                : "Encrypted account on file";
            json["documents"] = JsonSerializer.SerializeToNode(documents, WebJson);
            return json;
        }
    }
}