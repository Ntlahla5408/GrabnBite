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
        // Resolve checkout-race cases only after every other recorded attempt is verified terminal.
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

            // Read a snapshot first and verify provider state without holding a database
            // transaction open across network requests.
            var paymentSnapshot = await _context.Payments
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (paymentSnapshot == null)
                return NotFound("Payment not found.");

            if (!string.Equals(paymentSnapshot.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                return Conflict("Only a provider-confirmed paid payment can be reconciled this way.");

            if (!paymentSnapshot.RequiresReconciliation ||
                !string.Equals(paymentSnapshot.RefundStatus, "NOT_REQUIRED", StringComparison.OrdinalIgnoreCase))
                return Conflict("This payment is not an unresolved no-refund checkout reconciliation. Use the refund workflow when a refund is required.");

            var checkoutEventReferences = await _context.PaymentReconciliationEvents
                .AsNoTracking()
                .Where(e => e.PaymentId == paymentId &&
                    (e.EventType == "YOCO_CHECKOUT_RETRY_STARTED" ||
                     e.EventType == "YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED" ||
                     e.EventType == "YOCO_STALE_CHECKOUT_COMPLETED"))
                .Select(e => e.ProviderReference)
                .ToListAsync();

            if (!checkoutEventReferences.Any(reference => !string.IsNullOrWhiteSpace(reference)))
                return Conflict("This resolution route only applies to checkout reconciliation cases recorded by the system.");

            var multipleCheckoutCompletions = await _context.PaymentReconciliationEvents
                .AsNoTracking()
                .AnyAsync(e => e.PaymentId == paymentId &&
                               e.EventType == "YOCO_MULTIPLE_CHECKOUTS_COMPLETED");

            if (multipleCheckoutCompletions)
                return Conflict("Multiple completed checkouts were recorded. Refund/reconciliation review is required; this route cannot close that case.");

            var successfulCheckoutReference = paymentSnapshot.TransactionReference;
            if (string.IsNullOrWhiteSpace(successfulCheckoutReference))
                return Conflict("The successful checkout reference is missing. Verify the payment manually before resolving this case.");

            var checkoutIds = checkoutEventReferences
                .Where(reference => !string.IsNullOrWhiteSpace(reference))
                .Select(reference => reference!)
                .Append(paymentSnapshot.YocoCheckoutId ?? string.Empty)
                .Where(reference => !string.IsNullOrWhiteSpace(reference))
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (!checkoutIds.Contains(successfulCheckoutReference, StringComparer.Ordinal))
                checkoutIds.Add(successfulCheckoutReference);

            try
            {
                foreach (var checkoutId in checkoutIds)
                {
                    if (string.Equals(checkoutId, successfulCheckoutReference, StringComparison.Ordinal))
                        continue;

                    var checkout = await _yocoPaymentService.GetCheckoutStatusAsync(checkoutId);
                    if (!string.Equals(checkout.Id, checkoutId, StringComparison.Ordinal) ||
                        checkout.Amount != (int)Math.Round(paymentSnapshot.Amount * 100) ||
                        !string.Equals(checkout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                    {
                        return Conflict("A recorded Yoco checkout could not be matched to this payment.");
                    }

                    if (!string.Equals(checkout.Status, "failed", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(checkout.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        return Conflict("Another recorded checkout is not confirmed failed or cancelled. Keep reconciliation open until every checkout outcome is clear.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not verify all recorded Yoco checkouts while resolving payment {PaymentId}", paymentId);
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "Unable to verify every recorded Yoco checkout. Reconciliation remains open." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound("Payment not found.");

            // Revalidate every state assumption after the network calls. If a webhook,
            // retry or refund update changed the record while verification was in flight,
            // leave the case open for a fresh review.
            if (!string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase) ||
                !payment.RequiresReconciliation ||
                !string.Equals(payment.RefundStatus, "NOT_REQUIRED", StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(payment.TransactionReference, successfulCheckoutReference, StringComparison.Ordinal) ||
                payment.Amount != paymentSnapshot.Amount ||
                !string.Equals(payment.YocoCheckoutId, paymentSnapshot.YocoCheckoutId, StringComparison.Ordinal))
            {
                await transaction.RollbackAsync();
                return Conflict("Payment state changed during provider verification. Refresh the reconciliation queue and verify again.");
            }

            var latestCheckoutEventReferences = await _context.PaymentReconciliationEvents
                .AsNoTracking()
                .Where(e => e.PaymentId == paymentId &&
                    (e.EventType == "YOCO_CHECKOUT_RETRY_STARTED" ||
                     e.EventType == "YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED" ||
                     e.EventType == "YOCO_STALE_CHECKOUT_COMPLETED"))
                .Select(e => e.ProviderReference)
                .ToListAsync();

            var originalReferenceSet = checkoutEventReferences
                .Where(reference => !string.IsNullOrWhiteSpace(reference))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(reference => reference, StringComparer.Ordinal)
                .ToArray();
            var latestReferenceSet = latestCheckoutEventReferences
                .Where(reference => !string.IsNullOrWhiteSpace(reference))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(reference => reference, StringComparer.Ordinal)
                .ToArray();

            if (!originalReferenceSet.SequenceEqual(latestReferenceSet, StringComparer.Ordinal))
            {
                await transaction.RollbackAsync();
                return Conflict("Checkout history changed during provider verification. Refresh and verify every recorded attempt.");
            }

            var newMultipleCompletion = await _context.PaymentReconciliationEvents
                .AsNoTracking()
                .AnyAsync(e => e.PaymentId == paymentId &&
                               e.EventType == "YOCO_MULTIPLE_CHECKOUTS_COMPLETED");

            if (newMultipleCompletion)
            {
                await transaction.RollbackAsync();
                return Conflict("Multiple completed checkouts were recorded during verification. Keep reconciliation open for refund review.");
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
                Details = $"Administrator resolved Yoco checkout reconciliation after verifying all recorded checkout attempts. {details}",
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

    public class UpdateRefundStatusRequest
    {
        public string Status { get; set; } = string.Empty;

        public decimal? RefundAmount { get; set; }

        public string? Provider { get; set; }

        public string? ProviderReference { get; set; }

        public string Details { get; set; } = string.Empty;
    }
}