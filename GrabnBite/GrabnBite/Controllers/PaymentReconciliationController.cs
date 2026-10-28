using Npgsql;
using GrabnBite.Data;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Claims;
using GrabnBite.Services;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/payment-reconciliation")]
    [Authorize(Roles = "Admin")]
    public class PaymentReconciliationController : ControllerBase
    {
        private static readonly string[] AllowedRefundStatuses =
        {
            "REQUIRED",
            "PENDING",
            "SUCCEEDED",
            "FAILED",
            "MANUAL_REVIEW"
        };

        private static readonly Dictionary<string, string[]> AllowedTransitions = new()
        {
            ["NOT_REQUIRED"] = new[] { "REQUIRED", "MANUAL_REVIEW" },
            ["REQUIRED"] = new[] { "PENDING", "FAILED", "MANUAL_REVIEW" },
            ["PENDING"] = new[] { "SUCCEEDED", "FAILED", "MANUAL_REVIEW" },
            ["FAILED"] = new[] { "REQUIRED", "PENDING", "MANUAL_REVIEW" },
            ["MANUAL_REVIEW"] = new[] { "REQUIRED", "PENDING", "SUCCEEDED", "FAILED" },
            ["SUCCEEDED"] = Array.Empty<string>()
        };

        private readonly AppDbContext _context;
        private readonly YocoPaymentService _yocoPaymentService;
        private readonly ILogger<PaymentReconciliationController> _logger;

        public PaymentReconciliationController(
            AppDbContext context,
            YocoPaymentService yocoPaymentService,
            ILogger<PaymentReconciliationController> logger)
        {
            _context = context;
            _yocoPaymentService = yocoPaymentService;
            _logger = logger;
        }

        // GET: /api/payment-reconciliation/open
        // Admin-only queue for payments that need refund or reconciliation work.
        [HttpGet("open")]
        public async Task<IActionResult> GetOpenItems()
        {
            var items = await _context.Payments
                .AsNoTracking()
                .Where(p => p.RequiresReconciliation ||
                    p.RefundStatus == "REQUIRED" ||
                    p.RefundStatus == "PENDING" ||
                    p.RefundStatus == "FAILED" ||
                    p.RefundStatus == "MANUAL_REVIEW")
                .OrderBy(p => p.ReconciliationOpenedAt ?? p.RefundRequestedAt ?? p.PaymentDate)
                .Select(p => new
                {
                    p.PaymentId,
                    p.OrderId,
                    orderStatus = p.Order.Status,
                    p.PaymentStatus,
                    p.PaymentMethod,
                    p.Amount,
                    p.RefundStatus,
                    p.RefundAmount,
                    p.RefundRequiredAt,
                    p.RefundProvider,
                    p.RefundProviderReference,
                    p.RefundRequestedAt,
                    p.RefundCompletedAt,
                    p.RefundFailedAt,
                    p.RequiresReconciliation,
                    p.ReconciliationReason,
                    p.ReconciliationOpenedAt,
                    p.ReconciliationResolvedAt,
                    p.ReconciliationResolutionNotes
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET: /api/payment-reconciliation/{paymentId}/events
        // Return the append-only audit trail for a single payment.
        [HttpGet("{paymentId:int}/events")]
        public async Task<IActionResult> GetPaymentEvents(int paymentId)
        {
            if (paymentId <= 0)
                return BadRequest("A valid payment ID is required.");

            var paymentExists = await _context.Payments
                .AnyAsync(p => p.PaymentId == paymentId);

            if (!paymentExists)
                return NotFound("Payment not found.");

            var events = await _context.PaymentReconciliationEvents
                .AsNoTracking()
                .Where(e => e.PaymentId == paymentId)
                .OrderBy(e => e.CreatedAt)
                .Select(e => new
                {
                    e.PaymentReconciliationEventId,
                    e.ActorUserId,
                    e.ActorRole,
                    e.EventType,
                    e.RefundStatus,
                    e.ProviderReference,
                    e.Details,
                    e.CreatedAt
                })
                .ToListAsync();

            return Ok(events);
        }

        // PATCH: /api/payment-reconciliation/{paymentId}/resolve
        // Resolve a delayed old-checkout success only after the active retry is verified terminal.
        [HttpPatch("{paymentId:int}/resolve")]
        public async Task<IActionResult> ResolveDelayedCheckoutReconciliation(
            int paymentId,
            [FromBody] ResolvePaymentReconciliationRequest request)
        {
            if (paymentId <= 0)
                return BadRequest("A valid payment ID is required.");

            if (request == null || string.IsNullOrWhiteSpace(request.Details))
                return BadRequest("Resolution details are required.");

            if (string.IsNullOrWhiteSpace(request.ProviderReference))
                return BadRequest("Record the Yoco dashboard reference used during reconciliation.");

            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound("Payment not found.");

            if (!string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                return Conflict("Only a provider-confirmed paid payment can be reconciled this way.");

            if (!payment.RequiresReconciliation ||
                !string.Equals(payment.RefundStatus, "NOT_REQUIRED", StringComparison.OrdinalIgnoreCase))
                return Conflict("This payment is not an unresolved no-refund checkout reconciliation. Use the refund workflow when a refund is required.");

            var staleCheckoutEventExists = await _context.PaymentReconciliationEvents
                .AnyAsync(e => e.PaymentId == paymentId &&
                               e.EventType == "YOCO_STALE_CHECKOUT_COMPLETED");

            if (!staleCheckoutEventExists)
                return Conflict("This resolution route only applies to delayed checkout completions recorded by the system.");

            var multipleCheckoutCompletions = await _context.PaymentReconciliationEvents
                .AnyAsync(e => e.PaymentId == paymentId &&
                               e.EventType == "YOCO_MULTIPLE_CHECKOUTS_COMPLETED");

            if (multipleCheckoutCompletions)
                return Conflict("Multiple completed checkouts were recorded. Refund/reconciliation review is required; this route cannot close that case.");

            if (string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                return Conflict("The active Yoco checkout is not recorded yet. Verify its status before resolving this case.");

            try
            {
                var activeCheckout = await _yocoPaymentService.GetCheckoutStatusAsync(payment.YocoCheckoutId);
                if (!string.Equals(activeCheckout.Id, payment.YocoCheckoutId, StringComparison.Ordinal) ||
                    activeCheckout.Amount != (int)Math.Round(payment.Amount * 100) ||
                    !string.Equals(activeCheckout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict("The active Yoco checkout could not be matched to this payment.");
                }

                if (!string.Equals(activeCheckout.Status, "failed", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(activeCheckout.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict("The active checkout is not confirmed failed or cancelled. Keep reconciliation open until its outcome is clear.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not verify active Yoco checkout while resolving payment {PaymentId}", paymentId);
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "Unable to verify the active Yoco checkout. Reconciliation remains open." });
            }

            var now = DateTime.UtcNow;
            var evidenceReference = request.ProviderReference.Trim();
            var details = request.Details.Trim();

            payment.RequiresReconciliation = false;
            payment.ReconciliationResolvedAt = now;
            payment.ReconciliationResolutionNotes = details;

            var actorClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var actorUserId = int.TryParse(actorClaim, out var parsedActorId)
                ? parsedActorId
                : (int?)null;

            _context.PaymentReconciliationEvents.Add(new PaymentReconciliationEvent
            {
                PaymentId = payment.PaymentId,
                ActorUserId = actorUserId,
                ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Admin",
                EventType = "RECONCILIATION_RESOLVED",
                RefundStatus = payment.RefundStatus,
                ProviderReference = evidenceReference,
                Details = $"Administrator resolved delayed Yoco checkout reconciliation after verifying the active checkout was terminal. {details}",
                CreatedAt = now
            });

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex) when (ex is DbUpdateException ||
                                       ex is PostgresException postgresException &&
                                           postgresException.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrent reconciliation resolution for payment {PaymentId}", paymentId);
                return Conflict("The reconciliation record changed while being resolved. Refresh and review the latest status.");
            }

            return Ok(new
            {
                message = "Delayed checkout reconciliation was resolved. No refund was issued by this endpoint.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                paymentStatus = payment.PaymentStatus,
                requiresReconciliation = payment.RequiresReconciliation,
                reconciliationResolvedAt = payment.ReconciliationResolvedAt
            });
        }

        // PATCH: /api/payment-reconciliation/{paymentId}/resolve
        // Resolves a non-refund reconciliation after an administrator verifies
        // that no refund is required (for example, a delayed checkout notification).
        [HttpPatch("{paymentId:int}/resolve")]
        public async Task<IActionResult> ResolveReconciliation(
            int paymentId,
            [FromBody] ResolvePaymentReconciliationRequest request)
        {
            if (paymentId <= 0)
                return BadRequest("A valid payment ID is required.");

            if (request == null || string.IsNullOrWhiteSpace(request.Details))
                return BadRequest("Resolution details are required for the audit trail.");

            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound("Payment not found.");

            if (!string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                return Conflict("Only a provider-confirmed PAID payment can have its reconciliation resolved.");

            if (!payment.RequiresReconciliation)
                return Conflict("This payment has no open reconciliation case.");

            // Do not let this endpoint close an actual refund workflow. Refund
            // cases must be resolved through the refund-status endpoint instead.
            if (!string.Equals(payment.RefundStatus, "NOT_REQUIRED", StringComparison.OrdinalIgnoreCase))
                return Conflict("This payment has a refund workflow. Resolve the refund outcome through the refund-status endpoint.");

            var now = DateTime.UtcNow;
            payment.RequiresReconciliation = false;
            payment.ReconciliationResolvedAt = now;
            payment.ReconciliationResolutionNotes = request.Details.Trim();

            var actorClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var actorUserId = int.TryParse(actorClaim, out var parsedActorId)
                ? parsedActorId
                : (int?)null;
            var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";

            _context.PaymentReconciliationEvents.Add(new PaymentReconciliationEvent
            {
                PaymentId = payment.PaymentId,
                ActorUserId = actorUserId,
                ActorRole = actorRole,
                EventType = "RECONCILIATION_RESOLVED",
                RefundStatus = payment.RefundStatus,
                ProviderReference = payment.TransactionReference,
                Details = request.Details.Trim(),
                CreatedAt = now
            });

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex) when (ex is DbUpdateException ||
                                       ex is PostgresException postgresException &&
                                           postgresException.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrent payment reconciliation resolution for payment {PaymentId}", paymentId);
                return Conflict("The reconciliation record changed while it was being resolved. Refresh the record and try again.");
            }

            return Ok(new
            {
                message = "Reconciliation resolved. No refund was recorded or initiated.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                paymentStatus = payment.PaymentStatus,
                refundStatus = payment.RefundStatus,
                requiresReconciliation = payment.RequiresReconciliation,
                reconciliationResolvedAt = payment.ReconciliationResolvedAt,
                reconciliationResolutionNotes = payment.ReconciliationResolutionNotes
            });
        }

        // PATCH: /api/payment-reconciliation/{paymentId}/refund-status
        // This records a provider/manual outcome; it does not initiate a refund.
        [HttpPatch("{paymentId:int}/refund-status")]
        public async Task<IActionResult> UpdateRefundStatus(
            int paymentId,
            [FromBody] UpdateRefundStatusRequest request)
        {
            if (paymentId <= 0)
                return BadRequest("A valid payment ID is required.");

            if (request == null || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest("Refund status is required.");

            var nextStatus = request.Status.Trim().ToUpperInvariant();
            if (!AllowedRefundStatuses.Contains(nextStatus))
                return BadRequest("Status must be REQUIRED, PENDING, SUCCEEDED, FAILED or MANUAL_REVIEW.");

            if (string.IsNullOrWhiteSpace(request.Details))
                return BadRequest("Details are required for the reconciliation audit trail.");

            if (nextStatus == "SUCCEEDED" && string.IsNullOrWhiteSpace(request.ProviderReference))
                return BadRequest("A provider refund reference or documented manual refund reference is required to mark a refund successful.");

            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound("Payment not found.");

            if (!string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                return Conflict("A refund status can only be recorded for a provider-confirmed PAID payment.");

            if (!AllowedTransitions.TryGetValue(payment.RefundStatus, out var allowedNextStatuses) ||
                !allowedNextStatuses.Contains(nextStatus))
            {
                return Conflict($"Refund status cannot transition from {payment.RefundStatus} to {nextStatus}. Refresh the record and follow an allowed refund transition.");
            }

            var now = DateTime.UtcNow;
            var refundAmount = request.RefundAmount ?? payment.RefundAmount ?? payment.Amount;
            if (refundAmount <= 0 || refundAmount > payment.Amount)
                return BadRequest("Refund amount must be greater than zero and cannot exceed the original payment amount.");

            // This single-record model tracks one full refund. Partial or multiple
            // refunds need a separate Refunds table so successful partial refunds
            // cannot incorrectly close the entire reconciliation case.
            if (refundAmount != payment.Amount)
                return BadRequest("Partial refunds are not supported yet. The recorded refund amount must equal the original payment amount.");

            var previousStatus = payment.RefundStatus;
            payment.RefundStatus = nextStatus;
            payment.RefundAmount = refundAmount;

            if (!string.IsNullOrWhiteSpace(request.Provider))
                payment.RefundProvider = request.Provider.Trim();

            if (!string.IsNullOrWhiteSpace(request.ProviderReference))
                payment.RefundProviderReference = request.ProviderReference.Trim();

            if (nextStatus is "REQUIRED" or "PENDING")
            {
                payment.RefundRequiredAt ??= now;
                if (nextStatus == "PENDING")
                    payment.RefundRequestedAt ??= now;

                payment.RefundCompletedAt = null;
                payment.RefundFailedAt = null;
                payment.RequiresReconciliation = true;
                payment.ReconciliationReason = request.Details.Trim();
                payment.ReconciliationOpenedAt ??= now;
                payment.ReconciliationResolvedAt = null;
                payment.ReconciliationResolutionNotes = null;
            }
            else if (nextStatus == "FAILED")
            {
                payment.RefundRequiredAt ??= now;
                payment.RefundRequestedAt ??= now;
                payment.RefundFailedAt = now;
                payment.RefundCompletedAt = null;
                payment.RequiresReconciliation = true;
                payment.ReconciliationReason = request.Details.Trim();
                payment.ReconciliationOpenedAt ??= now;
                payment.ReconciliationResolvedAt = null;
                payment.ReconciliationResolutionNotes = null;
            }
            else if (nextStatus == "MANUAL_REVIEW")
            {
                payment.RefundRequiredAt ??= now;
                payment.RequiresReconciliation = true;
                payment.ReconciliationReason = request.Details.Trim();
                payment.ReconciliationOpenedAt ??= now;
                payment.ReconciliationResolvedAt = null;
                payment.ReconciliationResolutionNotes = null;
            }
            else // SUCCEEDED
            {
                payment.RefundRequiredAt ??= now;
                payment.RefundRequestedAt ??= now;
                payment.RefundCompletedAt = now;
                payment.RefundFailedAt = null;
                payment.RequiresReconciliation = false;
                payment.ReconciliationResolvedAt = now;
                payment.ReconciliationResolutionNotes = request.Details.Trim();
            }

            var actorClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var actorUserId = int.TryParse(actorClaim, out var parsedActorId)
                ? parsedActorId
                : (int?)null;
            var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Admin";

            _context.PaymentReconciliationEvents.Add(new PaymentReconciliationEvent
            {
                PaymentId = payment.PaymentId,
                ActorUserId = actorUserId,
                ActorRole = actorRole,
                EventType = "REFUND_STATUS_CHANGED",
                RefundStatus = nextStatus,
                ProviderReference = payment.RefundProviderReference,
                Details = $"Refund status changed from {previousStatus} to {nextStatus}. {request.Details.Trim()}",
                CreatedAt = now
            });

            try
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex) when (ex is DbUpdateException ||
                                       ex is PostgresException postgresException &&
                                           postgresException.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning(ex, "Concurrent refund reconciliation update for payment {PaymentId}", paymentId);
                return Conflict("The refund record changed while it was being updated. Refresh the reconciliation queue and try again.");
            }

            _logger.LogInformation(
                "Refund status for payment {PaymentId} changed from {PreviousStatus} to {NextStatus} by an administrator.",
                payment.PaymentId,
                previousStatus,
                nextStatus);

            return Ok(new
            {
                message = "Refund tracking status updated. This endpoint records a refund outcome; it does not call the payment provider.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                paymentStatus = payment.PaymentStatus,
                refundStatus = payment.RefundStatus,
                refundAmount = payment.RefundAmount,
                refundRequiredAt = payment.RefundRequiredAt,
                refundRequestedAt = payment.RefundRequestedAt,
                refundCompletedAt = payment.RefundCompletedAt,
                refundFailedAt = payment.RefundFailedAt,
                refundProvider = payment.RefundProvider,
                refundProviderReference = payment.RefundProviderReference,
                requiresReconciliation = payment.RequiresReconciliation,
                reconciliationResolvedAt = payment.ReconciliationResolvedAt
            });
        }
    }

    public class ResolvePaymentReconciliationRequest
    {
        public string ProviderReference { get; set; } = string.Empty;

        public string Details { get; set; } = string.Empty;
    }

    public class ResolvePaymentReconciliationRequest
    {
        public string Details { get; set; } = string.Empty;
    }

    public class UpdateRefundStatusRequest
    {
        public string Status { get; set; } = string.Empty;

        public decimal? RefundAmount { get; set; }

        public string? Provider { get; set; }

        public string? ProviderReference { get; set; }

        public string Details { get; set; } = string.Empty;
    }
}