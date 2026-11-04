using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using GrabnBite.Configuration;
using GrabnBite.Data;
using GrabnBite.Models.Entities;
using GrabnBite.Services;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Restaurant")]
    public class RestaurantApplicationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ISupabaseRestaurantDocumentStorageService _documentStorage;
        private readonly SupabaseRestaurantDocumentStorageSettings _documentStorageSettings;
        private readonly IRestaurantBankingEncryptionService _bankingEncryption;

        public RestaurantApplicationController(
            AppDbContext context,
            ISupabaseRestaurantDocumentStorageService documentStorage,
            IOptions<SupabaseRestaurantDocumentStorageSettings> documentStorageSettings,
            IRestaurantBankingEncryptionService bankingEncryption)
        {
            _context = context;
            _documentStorage = documentStorage;
            _documentStorageSettings = documentStorageSettings.Value;
            _bankingEncryption = bankingEncryption;
        }

        // POST: api/RestaurantApplication
        // A restaurant account may apply for more than one restaurant.
        [HttpPost]
        public async Task<IActionResult> CreateApplication(CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var now = DateTime.UtcNow;
            var application = new RestaurantApplication
            {
                UserId = userId,
                ApplicationReference = $"GB-{Guid.NewGuid().ToString("N")[..20].ToUpperInvariant()}",
                Status = RestaurantApplicationStatus.Draft,
                CreatedAt = now,
                UpdatedAt = now
            };

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            _context.RestaurantApplications.Add(application);
            await _context.SaveChangesAsync(cancellationToken);

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = application.RestaurantApplicationId,
                PreviousStatus = null,
                NewStatus = RestaurantApplicationStatus.Draft,
                Action = "ApplicationCreated",
                Comment = "Applicant created an additional restaurant partner application.",
                PerformedByUserId = userId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return CreatedAtAction(
                nameof(GetApplication),
                new { id = application.RestaurantApplicationId },
                new
                {
                    application.RestaurantApplicationId,
                    application.ApplicationReference,
                    status = application.Status.ToString(),
                    application.CreatedAt
                });
        }

        // GET: api/RestaurantApplication/my-applications
        [HttpGet("my-applications")]
        public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var applications = await _context.RestaurantApplications
                .AsNoTracking()
                .Where(application => application.UserId == userId)
                .OrderByDescending(application => application.UpdatedAt)
                .Select(application => new
                {
                    application.RestaurantApplicationId,
                    application.ApplicationReference,
                    status = application.Status.ToString(),
                    application.TradingName,
                    application.RegisteredBusinessName,
                    application.SubmittedAt,
                    application.CreatedAt,
                    application.UpdatedAt,
                    application.DocumentsRequestedMessage,
                    application.RejectionReason,
                    hasOperationalRestaurant = application.Restaurant != null &&
                        application.Restaurant.IsApproved &&
                        application.Restaurant.IsActive
                })
                .ToListAsync(cancellationToken);

            return Ok(applications);
        }

        // GET: api/RestaurantApplication/{id}
        // Only the owning account can retrieve its application.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetApplication(int id, CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var application = await _context.RestaurantApplications
                .AsNoTracking()
                .Include(item => item.OperatingHours)
                .Include(item => item.Documents)
                .Include(item => item.BankingDetails)
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id && item.UserId == userId,
                    cancellationToken);

            if (application == null)
            {
                return NotFound("Restaurant application not found.");
            }

            return Ok(new
            {
                application.RestaurantApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString(),
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
                application.DocumentsRequestedMessage,
                application.RejectionReason,
                application.AdminComments,
                application.CreatedAt,
                application.UpdatedAt,
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
                documents = application.Documents.Select(document => new
                {
                    document.RestaurantDocumentId,
                    documentType = document.DocumentType.ToString(),
                    document.DocumentDescription,
                    document.OriginalFileName,
                    document.ContentType,
                    document.FileSize,
                    verificationStatus = document.VerificationStatus.ToString(),
                    document.AdminComment,
                    document.UploadedAt
                }),
                bankingDetailsProvided = application.BankingDetails != null &&
                    !string.IsNullOrWhiteSpace(application.BankingDetails.AccountNumberEncrypted)
            });
        }

        // POST: api/RestaurantApplication/{id}/documents
        [HttpPost("{id:int}/documents")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument(
            int id,
            [FromForm] RestaurantDocumentType documentType,
            [FromForm] string? description,
            [FromForm] IFormFile? file,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var application = await _context.RestaurantApplications
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id && item.UserId == userId,
                    cancellationToken);

            if (application == null)
                return NotFound("Restaurant application not found.");

            if (application.Status is not RestaurantApplicationStatus.Draft
                and not RestaurantApplicationStatus.DocumentsRequired)
                return Conflict("Documents can only be uploaded while the application is editable.");

            if (!Enum.IsDefined(documentType))
                return BadRequest("Select a valid document type.");

            if (file == null || file.Length == 0)
                return BadRequest("Select a document to upload.");

            var maximumFileSize = _documentStorageSettings.MaxFileSizeBytes > 0
                ? _documentStorageSettings.MaxFileSizeBytes
                : 10 * 1024 * 1024;

            if (file.Length > maximumFileSize)
                return BadRequest($"The document exceeds the maximum size of {maximumFileSize / (1024 * 1024)} MB.");

            var contentType = file.ContentType?.ToLowerInvariant();
            if (contentType is not ("application/pdf" or "image/jpeg" or "image/png" or "image/webp"))
                return BadRequest("Only PDF, JPEG, PNG and WebP documents are supported.");

            await using var fileStream = file.OpenReadStream();
            var header = new byte[12];
            var bytesRead = await fileStream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
            var isPdf = bytesRead >= 5 && header[0] == 0x25 && header[1] == 0x50 &&
                header[2] == 0x44 && header[3] == 0x46 && header[4] == 0x2D;
            var isJpeg = bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
            var isPng = bytesRead >= 8 && header[0] == 0x89 && header[1] == 0x50 &&
                header[2] == 0x4E && header[3] == 0x47 && header[4] == 0x0D &&
                header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A;
            var isWebp = bytesRead >= 12 && header[0] == (byte)'R' &&
                header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F' &&
                header[8] == (byte)'W' && header[9] == (byte)'E' &&
                header[10] == (byte)'B' && header[11] == (byte)'P';

            var validSignature = (contentType == "application/pdf" && isPdf) ||
                (contentType == "image/jpeg" && isJpeg) ||
                (contentType == "image/png" && isPng) ||
                (contentType == "image/webp" && isWebp);

            if (!validSignature)
                return BadRequest("The file contents do not match the selected document type.");

            fileStream.Position = 0;
            var extension = contentType switch
            {
                "application/pdf" => ".pdf",
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => throw new InvalidOperationException("Unsupported document content type.")
            };

            var storagePath = $"applications/{id}/{Guid.NewGuid():N}{extension}";
            var originalFileName = Path.GetFileName(file.FileName.Replace('\\', '/'));
            if (originalFileName.Length > 255)
                originalFileName = originalFileName[^255..];

            await _documentStorage.UploadAsync(
                fileStream, storagePath, contentType, cancellationToken);

            var document = new RestaurantDocument
            {
                RestaurantApplicationId = id,
                DocumentType = documentType,
                DocumentDescription = string.IsNullOrWhiteSpace(description)
                    ? null
                    : description.Trim(),
                StoragePath = storagePath,
                OriginalFileName = originalFileName,
                ContentType = contentType,
                FileSize = file.Length,
                VerificationStatus = RestaurantVerificationStatus.Pending,
                UploadedAt = DateTime.UtcNow
            };

            _context.RestaurantDocuments.Add(document);
            application.UpdatedAt = DateTime.UtcNow;
            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "DocumentUploaded",
                Comment = $"Applicant uploaded {documentType} document.",
                PerformedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                await _documentStorage.DeleteAsync(storagePath, cancellationToken);
                throw;
            }

            return CreatedAtAction(
                nameof(GetApplication),
                new { id },
                new
                {
                    document.RestaurantDocumentId,
                    documentType = document.DocumentType.ToString(),
                    document.OriginalFileName,
                    document.ContentType,
                    document.FileSize,
                    verificationStatus = document.VerificationStatus.ToString(),
                    document.UploadedAt
                });
        }

        // GET: api/RestaurantApplication/{id}/documents/{documentId}/download
        [HttpGet("{id:int}/documents/{documentId:int}/download")]
        public async Task<IActionResult> GetDocumentDownloadUrl(
            int id,
            int documentId,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var document = await _context.RestaurantDocuments
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.RestaurantDocumentId == documentId &&
                        item.RestaurantApplicationId == id &&
                        item.RestaurantApplication.UserId == userId,
                    cancellationToken);

            if (document == null)
                return NotFound("Document not found.");

            var signedUrl = await _documentStorage.CreateSignedUrlAsync(
                document.StoragePath, 900, cancellationToken);

            return Ok(new
            {
                document.RestaurantDocumentId,
                document.OriginalFileName,
                document.ContentType,
                signedUrl,
                expiresInSeconds = 900
            });
        }

        // DELETE: api/RestaurantApplication/{id}/documents/{documentId}
        [HttpDelete("{id:int}/documents/{documentId:int}")]
        public async Task<IActionResult> DeleteDocument(
            int id,
            int documentId,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var application = await _context.RestaurantApplications
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id && item.UserId == userId,
                    cancellationToken);

            if (application == null)
                return NotFound("Restaurant application not found.");

            if (application.Status is not RestaurantApplicationStatus.Draft
                and not RestaurantApplicationStatus.DocumentsRequired)
                return Conflict("Documents can only be changed while the application is editable.");

            var document = await _context.RestaurantDocuments
                .FirstOrDefaultAsync(
                    item => item.RestaurantDocumentId == documentId &&
                        item.RestaurantApplicationId == id,
                    cancellationToken);

            if (document == null)
                return NotFound("Document not found.");

            if (document.VerificationStatus != RestaurantVerificationStatus.Pending)
                return Conflict("A document that has been reviewed cannot be deleted.");

            _context.RestaurantDocuments.Remove(document);
            application.UpdatedAt = DateTime.UtcNow;
            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "DocumentDeleted",
                Comment = $"Applicant removed {document.DocumentType} document.",
                PerformedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        // GET: api/RestaurantApplication/{id}/banking-details
        // Never return the full account number or encrypted value.
        [HttpGet("{id:int}/banking-details")]
        public async Task<IActionResult> GetBankingDetails(
            int id,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var banking = await _context.RestaurantBankingDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id &&
                        item.RestaurantApplication.UserId == userId,
                    cancellationToken);

            if (banking == null)
                return NotFound("Banking details have not been provided.");

            var accountNumber = _bankingEncryption.Decrypt(banking.AccountNumberEncrypted);

            return Ok(new
            {
                banking.AccountHolderName,
                banking.BankName,
                banking.AccountType,
                maskedAccountNumber = accountNumber.Length <= 4
                    ? new string('*', accountNumber.Length)
                    : new string('*', accountNumber.Length - 4) + accountNumber[^4..],
                banking.BranchCode,
                banking.PayoutContactEmail,
                verificationStatus = banking.VerificationStatus.ToString(),
                banking.VerifiedAt,
                banking.UpdatedAt
            });
        }

        // PUT: api/RestaurantApplication/{id}/banking-details
        [HttpPut("{id:int}/banking-details")]
        public async Task<IActionResult> SaveBankingDetails(
            int id,
            [FromBody] SaveRestaurantBankingDetailsRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var application = await _context.RestaurantApplications
                .Include(item => item.BankingDetails)
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id && item.UserId == userId,
                    cancellationToken);

            if (application == null)
                return NotFound("Restaurant application not found.");

            if (application.Status is not RestaurantApplicationStatus.Draft
                and not RestaurantApplicationStatus.DocumentsRequired)
                return Conflict("Banking details can only be changed while the application is editable.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var accountNumber = request.AccountNumber.Trim();
            var encryptedAccountNumber = _bankingEncryption.Encrypt(accountNumber);
            var now = DateTime.UtcNow;

            var banking = application.BankingDetails;
            if (banking == null)
            {
                banking = new RestaurantBankingDetail
                {
                    RestaurantApplicationId = id,
                    CreatedAt = now
                };
                _context.RestaurantBankingDetails.Add(banking);
            }

            banking.AccountHolderName = request.AccountHolderName.Trim();
            banking.BankName = request.BankName.Trim();
            banking.AccountType = request.AccountType.Trim();
            banking.AccountNumberEncrypted = encryptedAccountNumber;
            banking.BranchCode = request.BranchCode.Trim();
            banking.PayoutContactEmail = request.PayoutContactEmail.Trim();
            banking.VerificationStatus = RestaurantVerificationStatus.Pending;
            banking.VerifiedByUserId = null;
            banking.VerifiedAt = null;
            banking.UpdatedAt = now;
            application.UpdatedAt = now;

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = id,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "BankingDetailsSaved",
                Comment = "Applicant saved or updated encrypted payout banking details.",
                PerformedByUserId = userId,
                CreatedAt = now
            });

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "Banking details saved securely.",
                banking.AccountHolderName,
                banking.BankName,
                banking.AccountType,
                maskedAccountNumber = new string('*', Math.Max(0, accountNumber.Length - 4)) + accountNumber[^4..],
                banking.BranchCode,
                banking.PayoutContactEmail,
                verificationStatus = banking.VerificationStatus.ToString()
            });
        }

        // PUT: api/RestaurantApplication/{id}/draft
        // Draft and documents-required applications can be edited and saved.
        [HttpPut("{id:int}/draft")]
        public async Task<IActionResult> SaveDraft(
            int id,
            [FromBody] SaveRestaurantApplicationDraftRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var application = await _context.RestaurantApplications
                .Include(item => item.OperatingHours)
                .FirstOrDefaultAsync(
                    item => item.RestaurantApplicationId == id && item.UserId == userId,
                    cancellationToken);

            if (application == null)
            {
                return NotFound("Restaurant application not found.");
            }

            var status = application.Status.ToString();
            if (status != "Draft" && status != "DocumentsRequired")
            {
                return Conflict("This application can no longer be edited in its current status.");
            }

            if (request.AveragePreparationTimeMinutes is < 1 or > 600)
            {
                ModelState.AddModelError(
                    nameof(request.AveragePreparationTimeMinutes),
                    "Preparation time must be between 1 and 600 minutes.");
            }

            if (request.MaximumDeliveryDistanceKm is < 0 or > 500)
            {
                ModelState.AddModelError(
                    nameof(request.MaximumDeliveryDistanceKm),
                    "Delivery distance must be between 0 and 500 km.");
            }

            var operatingHours = request.OperatingHours
                ?? new List<RestaurantOperatingHourDraftRequest>();

            if (request.OperatingHours == null || operatingHours.Count > 7)
            {
                ModelState.AddModelError(
                    nameof(request.OperatingHours),
                    "Provide no more than seven operating-hours entries.");
            }
            else
            {
                var duplicateDays = operatingHours
                    .GroupBy(hour => hour.DayOfWeek)
                    .Any(group => group.Count() > 1);

                if (duplicateDays)
                {
                    ModelState.AddModelError(
                        nameof(request.OperatingHours),
                        "Only one operating-hours entry is allowed per day.");
                }

                foreach (var hour in operatingHours)
                {
                    if (!Enum.IsDefined(hour.DayOfWeek))
                    {
                        ModelState.AddModelError(
                            nameof(request.OperatingHours),
                            "An operating-hours entry contains an invalid weekday.");
                        continue;
                    }

                    if (hour.IsOpen &&
                        (!hour.OpeningTime.HasValue ||
                         !hour.ClosingTime.HasValue ||
                         hour.OpeningTime >= hour.ClosingTime))
                    {
                        ModelState.AddModelError(
                            nameof(request.OperatingHours),
                            $"Valid opening and closing times are required for {hour.DayOfWeek}.");
                    }
                }
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            application.TradingName = request.TradingName?.Trim();
            application.RegisteredBusinessName = request.RegisteredBusinessName?.Trim();
            application.CipcRegistrationNumber = request.CipcRegistrationNumber?.Trim();
            application.RestaurantCategory = request.RestaurantCategory?.Trim();
            application.PhysicalAddress = request.PhysicalAddress?.Trim();
            application.City = request.City?.Trim();
            application.RestaurantContactNumber = request.RestaurantContactNumber?.Trim();
            application.BusinessEmail = request.BusinessEmail?.Trim();
            application.WebsiteOrSocialMediaUrl = request.WebsiteOrSocialMediaUrl?.Trim();
            application.RepresentativeFullName = request.RepresentativeFullName?.Trim();
            application.RepresentativePosition = request.RepresentativePosition?.Trim();
            application.RepresentativeMobileNumber = request.RepresentativeMobileNumber?.Trim();
            application.RepresentativeEmail = request.RepresentativeEmail?.Trim();
            application.HasAuthorityToRepresent = request.HasAuthorityToRepresent;
            application.OffersCustomerCollection = request.OffersCustomerCollection;
            application.OffersRestaurantDelivery = request.OffersRestaurantDelivery;
            application.OffersGrubnBiteDelivery = request.OffersGrubnBiteDelivery;
            application.AveragePreparationTimeMinutes = request.AveragePreparationTimeMinutes;
            application.MaximumDeliveryDistanceKm = request.MaximumDeliveryDistanceKm;
            application.DeliveryInstructions = request.DeliveryInstructions?.Trim();
            application.CommissionOfferAccepted = request.CommissionOfferAccepted;
            application.UpdatedAt = DateTime.UtcNow;

            var submittedHours = operatingHours.ToDictionary(hour => hour.DayOfWeek);
            foreach (var existingHour in application.OperatingHours.ToList())
            {
                if (!submittedHours.ContainsKey(existingHour.DayOfWeek))
                {
                    _context.RestaurantOperatingHours.Remove(existingHour);
                }
            }

            foreach (var submittedHour in operatingHours)
            {
                var existingHour = application.OperatingHours
                    .FirstOrDefault(hour => hour.DayOfWeek == submittedHour.DayOfWeek);

                if (existingHour == null)
                {
                    existingHour = new RestaurantOperatingHour
                    {
                        RestaurantApplicationId = application.RestaurantApplicationId,
                        DayOfWeek = submittedHour.DayOfWeek
                    };
                    application.OperatingHours.Add(existingHour);
                }

                existingHour.IsOpen = submittedHour.IsOpen;
                existingHour.OpeningTime = submittedHour.IsOpen
                    ? submittedHour.OpeningTime
                    : null;
                existingHour.ClosingTime = submittedHour.IsOpen
                    ? submittedHour.ClosingTime
                    : null;
            }

            _context.RestaurantApplicationHistories.Add(new RestaurantApplicationHistory
            {
                RestaurantApplicationId = application.RestaurantApplicationId,
                PreviousStatus = application.Status,
                NewStatus = application.Status,
                Action = "DraftSaved",
                Comment = "Applicant saved application business information.",
                PerformedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                application.RestaurantApplicationId,
                application.ApplicationReference,
                status = application.Status.ToString(),
                application.UpdatedAt,
                message = "Your application draft has been saved."
            });
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out userId);
        }
    }

    public class SaveRestaurantApplicationDraftRequest
    {
        [StringLength(200)]
        public string? TradingName { get; set; }

        [StringLength(200)]
        public string? RegisteredBusinessName { get; set; }

        [StringLength(100)]
        public string? CipcRegistrationNumber { get; set; }

        [StringLength(100)]
        public string? RestaurantCategory { get; set; }

        [StringLength(500)]
        public string? PhysicalAddress { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(30)]
        public string? RestaurantContactNumber { get; set; }

        [EmailAddress, StringLength(254)]
        public string? BusinessEmail { get; set; }

        [Url, StringLength(500)]
        public string? WebsiteOrSocialMediaUrl { get; set; }

        [StringLength(200)]
        public string? RepresentativeFullName { get; set; }

        [StringLength(100)]
        public string? RepresentativePosition { get; set; }

        [StringLength(30)]
        public string? RepresentativeMobileNumber { get; set; }

        [EmailAddress, StringLength(254)]
        public string? RepresentativeEmail { get; set; }

        public bool? HasAuthorityToRepresent { get; set; }
        public bool? OffersCustomerCollection { get; set; }
        public bool? OffersRestaurantDelivery { get; set; }
        public bool? OffersGrubnBiteDelivery { get; set; }

        [Range(1, 600)]
        public int? AveragePreparationTimeMinutes { get; set; }

        [Range(typeof(decimal), "0", "500")]
        public decimal? MaximumDeliveryDistanceKm { get; set; }

        [StringLength(1000)]
        public string? DeliveryInstructions { get; set; }

        public bool? CommissionOfferAccepted { get; set; }

        public List<RestaurantOperatingHourDraftRequest> OperatingHours { get; set; } = new();
    }

    public class RestaurantOperatingHourDraftRequest
    {
        public DayOfWeek DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public TimeOnly? OpeningTime { get; set; }
        public TimeOnly? ClosingTime { get; set; }
    }
}

namespace GrabnBite.Controllers
{
    public class SaveRestaurantBankingDetailsRequest
    {
        [Required, StringLength(200)]
        public string AccountHolderName { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string BankName { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string AccountType { get; set; } = string.Empty;

        [Required, RegularExpression(@"^[0-9]{6,20}$",
            ErrorMessage = "Account number must contain 6 to 20 digits.")]
        public string AccountNumber { get; set; } = string.Empty;

        [Required, RegularExpression(@"^[0-9]{6}$",
            ErrorMessage = "Branch code must contain 6 digits.")]
        public string BranchCode { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(254)]
        public string PayoutContactEmail { get; set; } = string.Empty;
    }
}
