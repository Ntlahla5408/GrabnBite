using System.Security.Claims;
using System.Text;
using GrabnBite.Configuration;
using GrabnBite.Data;
using GrabnBite.DTOs.Policy;
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
    public sealed class PoliciesController : ControllerBase
    {
        private const string PdfContentType = "application/pdf";
        private readonly AppDbContext _context;
        private readonly ISupabasePolicyStorageService _storage;
        private readonly SupabaseStorageSettings _storageSettings;
        private readonly ILogger<PoliciesController> _logger;

        public PoliciesController(
            AppDbContext context,
            ISupabasePolicyStorageService storage,
            IOptions<SupabaseStorageSettings> storageSettings,
            ILogger<PoliciesController> logger)
        {
            _context = context;
            _storage = storage;
            _storageSettings = storageSettings.Value;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<PolicyDocumentResponseDto>>> GetPublishedPolicies(
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var policies = await _context.PolicyDocuments
                .AsNoTracking()
                .Where(policy =>
                    !policy.IsArchived &&
                    policy.Status == "Published" &&
                    (policy.EffectiveDate == null || policy.EffectiveDate <= now))
                 .OrderBy(policy => policy.Title)
                .ToListAsync(cancellationToken);

            return Ok(policies.Select(ToResponse).ToList());
        }

        [AllowAnonymous]
        [HttpGet("{policyDocumentId:int}")]
        public async Task<ActionResult<PolicyDocumentResponseDto>> GetPublishedPolicy(
            int policyDocumentId,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var policy = await _context.PolicyDocuments
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.PolicyDocumentId == policyDocumentId &&
                    !item.IsArchived &&
                    item.Status == "Published" &&
                    (item.EffectiveDate == null || item.EffectiveDate <= now),
                    cancellationToken);

            if (policy == null)
                return NotFound();

            var response = ToResponse(policy);
            response.FileUrl = await _storage.CreateSignedUrlAsync(
                policy.StoragePath, cancellationToken: cancellationToken);
            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public async Task<ActionResult<IReadOnlyList<PolicyDocumentResponseDto>>> GetAdminPolicies(
            CancellationToken cancellationToken)
        {
            var policies = await _context.PolicyDocuments
                .AsNoTracking()
                .Where(policy => !policy.IsArchived)
                 .OrderByDescending(policy => policy.UpdatedAt ?? policy.CreatedAt)
                .ToListAsync(cancellationToken);

            return Ok(policies.Select(ToResponse).ToList());
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<ActionResult<PolicyDocumentResponseDto>> CreatePolicy(
            [FromForm] PolicyDocumentFormRequest request,
            CancellationToken cancellationToken)
        {
            var validationError = ValidateMetadata(request);
            if (validationError != null)
                return BadRequest(validationError);

            if (request.PdfFile == null)
                return BadRequest("A PDF document is required.");

            var fileError = await ValidatePdfAsync(request.PdfFile, cancellationToken);
            if (fileError != null)
                return BadRequest(fileError);

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var storagePath = $"policies/{Guid.NewGuid():N}.pdf";
            await using var stream = request.PdfFile.OpenReadStream();
            await _storage.UploadPdfAsync(stream, storagePath, cancellationToken);

            var policy = new PolicyDocument
            {
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                StoragePath = storagePath,
                OriginalFileName = Path.GetFileName(request.PdfFile.FileName),
                ContentType = PdfContentType,
                FileSize = request.PdfFile.Length,
                Status = NormalizeStatus(request.Status),
                EffectiveDate = NormalizeDate(request.EffectiveDate),
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId.Value
            };

            try
            {
                _context.PolicyDocuments.Add(policy);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                await TryDeleteStorageObjectAsync(upload.StoragePath, cancellationToken);
                throw;
            }

            return CreatedAtAction(
                nameof(GetPublishedPolicy),
                new { policyDocumentId = policy.PolicyDocumentId },
                ToResponse(policy));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{policyDocumentId:int}")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<ActionResult<PolicyDocumentResponseDto>> UpdatePolicy(
            int policyDocumentId,
            [FromForm] PolicyDocumentFormRequest request,
            CancellationToken cancellationToken)
        {
            var validationError = ValidateMetadata(request);
            if (validationError != null)
                return BadRequest(validationError);

            if (request.PdfFile != null)
            {
                var fileError = await ValidatePdfAsync(request.PdfFile, cancellationToken);
                if (fileError != null)
                    return BadRequest(fileError);
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var policy = await _context.PolicyDocuments.FirstOrDefaultAsync(
                item => item.PolicyDocumentId == policyDocumentId && !item.IsArchived,
                cancellationToken);

            if (policy == null)
                return NotFound("Policy document not found.");

            string? previousStoragePath = null;
            string? newStoragePath = null;

            if (request.PdfFile != null)
            {
                newStoragePath = $"policies/{Guid.NewGuid():N}.pdf";
                await using var stream = request.PdfFile.OpenReadStream();
                await _storage.UploadPdfAsync(stream, newStoragePath, cancellationToken);
                previousStoragePath = policy.StoragePath;
                policy.StoragePath = newStoragePath;
                policy.OriginalFileName = Path.GetFileName(request.PdfFile.FileName);
                policy.ContentType = PdfContentType;
                policy.FileSize = request.PdfFile.Length;
                policy.Version++;
            }

            policy.Title = request.Title.Trim();
            policy.Description = request.Description.Trim();
            policy.Status = NormalizeStatus(request.Status);
            policy.EffectiveDate = NormalizeDate(request.EffectiveDate);
            policy.UpdatedAt = DateTime.UtcNow;
            policy.UpdatedByUserId = userId.Value;

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                if (newStoragePath != null)
                    await TryDeleteStorageObjectAsync(newStoragePath, cancellationToken);
                throw;
            }

            if (previousStoragePath != null)
                await TryDeleteStorageObjectAsync(previousStoragePath, cancellationToken);

            return Ok(ToResponse(policy));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{policyDocumentId:int}")]
        public async Task<IActionResult> ArchivePolicy(
            int policyDocumentId,
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var policy = await _context.PolicyDocuments.FirstOrDefaultAsync(
                item => item.PolicyDocumentId == policyDocumentId && !item.IsArchived,
                cancellationToken);

            if (policy == null)
                return NotFound("Policy document not found.");

            // Archive the record rather than destroying the audit trail or stored PDF.
            policy.IsArchived = true;
            policy.Status = "Archived";
            policy.UpdatedAt = DateTime.UtcNow;
            policy.UpdatedByUserId = userId.Value;

            await _context.SaveChangesAsync(cancellationToken);
            return NoContent();
        }

        private string? ValidateMetadata(PolicyDocumentFormRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length > 180)
                return "A policy title is required and must not exceed 180 characters.";

            if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length > 500)
                return "A policy description is required and must not exceed 500 characters.";

            if (!string.Equals(request.Status, "Draft", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(request.Status, "Published", StringComparison.OrdinalIgnoreCase))
                return "Status must be Draft or Published.";

            return null;
        }

        private async Task<string?> ValidatePdfAsync(
            IFormFile file,
            CancellationToken cancellationToken)
        {
            if (file.Length <= 0)
                return "The selected PDF is empty.";

            if (file.Length > _storageSettings.MaxFileSizeBytes)
                return $"The PDF exceeds the {_storageSettings.MaxFileSizeBytes / (1024 * 1024)} MB upload limit.";

            if (!string.Equals(Path.GetExtension(file.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
                return "Only PDF documents are accepted.";

            await using var stream = file.OpenReadStream();
            var header = new byte[5];
            var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);

            if (bytesRead != header.Length || Encoding.ASCII.GetString(header) != "%PDF-")
                return "The selected file does not contain a valid PDF header.";

            return null;
        }

        private static DateTime? NormalizeDate(DateTime? value)
        {
            return value.HasValue
                ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
                : null;
        }

        private static string NormalizeStatus(string status)
        {
            return string.Equals(status, "Published", StringComparison.OrdinalIgnoreCase)
                ? "Published"
                : "Draft";
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            return int.TryParse(value, out var userId) ? userId : null;
        }

        private PolicyDocumentResponseDto ToResponse(PolicyDocument policy)
        {
            return new PolicyDocumentResponseDto
            {
                PolicyDocumentId = policy.PolicyDocumentId,
                Title = policy.Title,
                Description = policy.Description,
                FileUrl = _storage.GetPublicUrl(policy.StoragePath),
                OriginalFileName = policy.OriginalFileName,
                Status = policy.Status,
                EffectiveDate = policy.EffectiveDate,
                Version = policy.Version,
                CreatedAt = policy.CreatedAt,
                UpdatedAt = policy.UpdatedAt
            };
        }

        private async Task TryDeleteStorageObjectAsync(
            string storagePath,
            CancellationToken cancellationToken)
        {
            try
            {
                await _storage.DeleteAsync(storagePath, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Could not clean up policy PDF storage object {StoragePath}.",
                    storagePath);
            }
        }
    }
}