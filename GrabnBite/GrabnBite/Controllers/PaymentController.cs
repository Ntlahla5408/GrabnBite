using GrabnBite.Data;
using GrabnBite.DTOs.Payment;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrabnBite.Services;
using System.Security.Claims;
using System.IO;
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using GrabnBite.Configuration;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly YocoPaymentService _yocoPaymentService;
        private readonly YocoSettings _yocoSettings;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            AppDbContext context,
            YocoPaymentService yocoPaymentService,
            IOptions<YocoSettings> yocoSettings,
            ILogger<PaymentController> logger)
        {
            _context = context;
            _yocoPaymentService = yocoPaymentService;
            _yocoSettings = yocoSettings.Value;
            _logger = logger;
        }

        // ============================================================
        // HELPER - Get logged-in user ID from JWT
        // ============================================================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out var userId)
                ? userId
                : null;
        }

        // ============================================================
        // CREATE PAYMENT
        // POST: /api/Payment/{orderId}
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpPost("{orderId}")]
        public async Task<IActionResult> CreatePayment(
            int orderId,
            CreatePaymentDto dto)
        {
            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.PaymentMethod))
            {
                return BadRequest("Payment method is required.");
            }

            var paymentMethod = dto.PaymentMethod.Trim().ToUpper();

            var validMethods = new[]
            {
                "CARD",
                "EFT",
                "CASH"
            };

            if (!validMethods.Contains(paymentMethod))
            {
                return BadRequest(
                    "Invalid payment method. Use CARD, EFT, or CASH.");
            }

            // --------------------------------------------------------
            // Find order belonging to logged-in customer
            // --------------------------------------------------------

            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == orderId &&
                    o.UserId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // --------------------------------------------------------
            // Don't allow payment for cancelled orders
            // --------------------------------------------------------

            if (order.Status == "CANCELLED")
            {
                return BadRequest(
                    "A cancelled order cannot be paid.");
            }

            // --------------------------------------------------------
            // Validate order amount
            // --------------------------------------------------------

            if (order.TotalAmount <= 0)
            {
                return BadRequest(
                    "Order amount must be greater than zero.");
            }

            // --------------------------------------------------------
            // Don't create duplicate payment
            // --------------------------------------------------------

            if (order.Payment != null)
            {
                return BadRequest(
                    "A payment already exists for this order.");
            }

            // --------------------------------------------------------
            // Create payment
            // --------------------------------------------------------

            var payment = new Payment
            {
                OrderId = order.OrderId,

                // NEVER trust payment amount from frontend.
                Amount = order.TotalAmount,

                PaymentStatus = "PENDING",

                PaymentMethod = paymentMethod,

                PaymentReference =
                    $"GNB-PAY-{Guid.NewGuid():N}"
                        .Substring(0, 16)
                        .ToUpper(),

                PaymentDate = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // The unique OrderId index is the final guard if two requests
                // try to create the payment at the same time.
                _logger.LogWarning(ex, "Concurrent payment creation detected for order {OrderId}", orderId);
                return Conflict("A payment was created for this order by another request. Refresh and check its status.");
            }

            return Ok(new PaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentStatus = payment.PaymentStatus,
                PaymentMethod = payment.PaymentMethod,
                PaymentReference = payment.PaymentReference,
                TransactionReference = payment.TransactionReference,
                PaymentDate = payment.PaymentDate
            });
        }

        // ============================================================
        // CREATE YOCO PAYMENT
        // POST: /api/Payment/yoco/{orderId}
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpPost("yoco/{orderId}")]
        public async Task<IActionResult> CreateYocoPayment(int orderId)
        {
            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            // --------------------------------------------------------
            // Find order belonging to logged-in customer
            // --------------------------------------------------------

            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == orderId &&
                    o.UserId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // --------------------------------------------------------
            // Don't allow payment for cancelled orders
            // --------------------------------------------------------

            if (order.Status == "CANCELLED")
            {
                return BadRequest(
                    "A cancelled order cannot be paid.");
            }

            // --------------------------------------------------------
            // Validate order amount
            // --------------------------------------------------------

            if (order.TotalAmount <= 0)
            {
                return BadRequest(
                    "Order amount must be greater than zero.");
            }

            // Reuse a payment only when no checkout was created, or when
            // Yoco has authoritatively confirmed the previous checkout failed/cancelled.
            Payment payment;
            if (order.Payment != null)
            {
                payment = order.Payment;
                if (payment.PaymentStatus == "PAID")
                    return BadRequest("This order has already been paid.");

                if (!string.Equals(payment.PaymentMethod, "YOCO", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("A different payment method is already recorded for this order.");

                if (!string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                {
                    try
                    {
                        var previousCheckout = await _yocoPaymentService.GetCheckoutStatusAsync(payment.YocoCheckoutId);
                        var terminalFailure =
                            string.Equals(previousCheckout.Status, "failed", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(previousCheckout.Status, "cancelled", StringComparison.OrdinalIgnoreCase);
                        if (!terminalFailure)
                            return Conflict("A Yoco checkout already exists for this order. Check its status before trying again.");
                        if (previousCheckout.Amount != (int)Math.Round(payment.Amount * 100) ||
                            !string.Equals(previousCheckout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                            return Conflict("The previous Yoco checkout does not match this order. Contact support before retrying.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not safely reconcile prior Yoco checkout for order {OrderId}", orderId);
                        return Conflict("The previous payment could not be verified. Please try again later or contact support.");
                    }
                }

                if (!string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                {
                    // A terminal checkout is a new payment attempt, so use a new
                    // idempotency key. For an ambiguous attempt with no saved
                    // checkout ID, keep the same key to avoid duplicate sessions.
                    payment.PaymentReference = $"GNB-YOCO-{Guid.NewGuid():N}".Substring(0, 18).ToUpper();
                }

                payment.PaymentStatus = "INITIATED";
                payment.YocoCheckoutId = null;
                payment.TransactionReference = null;
                payment.PaymentDate = DateTime.UtcNow;
            }
            else
            {
                payment = new Payment
                {
                    OrderId = order.OrderId,
                    Amount = order.TotalAmount,
                    PaymentStatus = "INITIATED",
                    PaymentMethod = "YOCO",
                    PaymentReference = $"GNB-YOCO-{Guid.NewGuid():N}".Substring(0, 18).ToUpper(),
                    PaymentDate = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Concurrent Yoco payment creation detected for order {OrderId}", orderId);
                return Conflict("A payment was created or changed for this order by another request. Refresh and check its status.");
            }

            var successUrl = _yocoSettings.SuccessUrl;
            var cancelUrl = _yocoSettings.CancelUrl;
            if (!Uri.TryCreate(successUrl, UriKind.Absolute, out var successUri) ||
                successUri.Scheme != Uri.UriSchemeHttps ||
                !Uri.TryCreate(cancelUrl, UriKind.Absolute, out var cancelUri) ||
                cancelUri.Scheme != Uri.UriSchemeHttps)
            {
                _logger.LogError("Yoco success/cancel URLs are missing or not HTTPS.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { message = "Online payments are not configured yet. Please contact support." });
            }

            successUrl = $"{successUrl.TrimEnd('/')}?orderId={order.OrderId}";
            cancelUrl = $"{cancelUrl.TrimEnd('/')}?orderId={order.OrderId}";

            try
            {
                var checkout =
                    await _yocoPaymentService.CreateCheckoutAsync(
                        payment.Amount,
                        "ZAR",
                        successUrl,
                        cancelUrl,
                        payment.PaymentReference ?? throw new InvalidOperationException("Payment reference is missing."));

                // ----------------------------------------------------
                // Save Yoco checkout ID
                // ----------------------------------------------------

                payment.YocoCheckoutId = checkout.Id;

                await _context.SaveChangesAsync();

                // ----------------------------------------------------
                // Return checkout information
                // ----------------------------------------------------

                return Ok(new PaymentResponseDto
                {
                    PaymentId = payment.PaymentId,
                    OrderId = payment.OrderId,
                    Amount = payment.Amount,
                    PaymentStatus = payment.PaymentStatus,
                    PaymentMethod = payment.PaymentMethod,
                    PaymentReference = payment.PaymentReference,
                    TransactionReference = payment.TransactionReference,
                    PaymentDate = payment.PaymentDate,
                    YocoCheckoutId = payment.YocoCheckoutId,
                    RedirectUrl = checkout.RedirectUrl
                });
            }
            catch (Exception ex)
            {
                // The provider may have created the checkout even if the response
                // was lost. Keep this attempt INITIATED and retain its idempotency
                // key so a retry can safely reconcile/replay the same request.
                // Do not label an ambiguous provider outcome as a confirmed failure.
                _logger.LogError(ex, "Yoco checkout creation could not be confirmed for order {OrderId}", orderId);

                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new { message = "Unable to create Yoco checkout. Please check payment status before retrying." });
            }
        }

        // ============================================================
        // GET PAYMENT
        // GET: /api/Payment/{orderId}
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetPayment(int orderId)
        {
            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId &&
                    p.Order.UserId == userId.Value);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            return Ok(new PaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentStatus = payment.PaymentStatus,
                PaymentMethod = payment.PaymentMethod,
                PaymentReference = payment.PaymentReference,
                TransactionReference = payment.TransactionReference,
                PaymentDate = payment.PaymentDate,
                YocoCheckoutId = payment.YocoCheckoutId
            });
        }

        // ============================================================
        // YOCO SUCCESS REDIRECT
        // Yoco redirects here after checkout. The app verifies payment
        // separately with Yoco; this redirect is not proof of payment.
        // GET: /api/Payment/yoco/success?orderId={orderId}
        // ============================================================

        [AllowAnonymous]
        [HttpGet("yoco/success")]
        public IActionResult YocoSuccess(int orderId)
        {
            if (orderId <= 0)
                return BadRequest("A valid order ID is required.");

            // Return to the installed GrabnBite app. Payment must still be verified by the app.
            return Redirect($"grabnbitemobile://payment-success?orderId={orderId}");
        }

        // ============================================================
        // YOCO CANCEL REDIRECT
        // GET: /api/Payment/yoco/cancel?orderId={orderId}
        // ============================================================

        [AllowAnonymous]
        [HttpGet("yoco/cancel")]
        public IActionResult YocoCancel(int orderId)
        {
            if (orderId <= 0)
                return BadRequest("A valid order ID is required.");

            return Redirect($"grabnbitemobile://payment-cancelled?orderId={orderId}");
        }

        // Yoco's browser redirect is not proof of payment. This signed webhook
        // triggers a server-to-server lookup and uses that response as authority.
        [AllowAnonymous]
        [HttpPost("yoco/webhook")]
        public async Task<IActionResult> YocoWebhook()
        {
            if (string.IsNullOrWhiteSpace(_yocoSettings.WebhookSecret))
            {
                _logger.LogError("Yoco webhook secret is not configured.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable);
            }

            Request.EnableBuffering();
            string rawBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            if (!VerifyYocoWebhookSignature(rawBody))
                return Unauthorized();

            try
            {
                using var document = JsonDocument.Parse(rawBody);
                var root = document.RootElement;
                var checkoutId = FindCheckoutId(root);
                if (string.IsNullOrWhiteSpace(checkoutId))
                    return BadRequest("Webhook did not contain a checkout ID.");

                var payment = await _context.Payments
                    .Include(p => p.Order)
                    .FirstOrDefaultAsync(p => p.YocoCheckoutId == checkoutId);

                // A webhook may arrive before the checkout ID has been saved.
                // Return a retryable response so Yoco can deliver it again.
                if (payment == null)
                {
                    _logger.LogWarning("Received Yoco webhook for an unknown checkout; asking Yoco to retry.");
                    return StatusCode(StatusCodes.Status503ServiceUnavailable);
                }

                if (payment.PaymentStatus == "PAID")
                    return Ok(new { received = true, alreadyProcessed = true });

                var checkout = await _yocoPaymentService.GetCheckoutStatusAsync(checkoutId);
                if (!string.Equals(checkout.Id, payment.YocoCheckoutId, StringComparison.Ordinal) ||
                    checkout.Amount != (int)Math.Round(payment.Amount * 100) ||
                    !string.Equals(checkout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Yoco webhook checkout details did not match payment {PaymentId}", payment.PaymentId);
                    return BadRequest("Checkout details did not match the recorded payment.");
                }

                if (string.Equals(checkout.Status, "completed", StringComparison.OrdinalIgnoreCase))
                {
                    // Re-read order status inside the payment transaction so a cancellation
                    // that wins a race cannot be missed by this webhook.
                    var orderWasCancelled = await RecordVerifiedYocoPaymentAsync(payment, checkout.Id);

                    if (orderWasCancelled)
                    {
                        _logger.LogCritical(
                            "RECONCILIATION REQUIRED: Yoco confirmed payment {PaymentId} for cancelled order {OrderId}. Refund tracking was opened; do not fulfil the order.",
                            payment.PaymentId,
                            payment.OrderId);
                    }
                }
                else if (string.Equals(checkout.Status, "failed", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(checkout.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    // Conditional update makes PAID terminal even if a failure callback
                    // races with a successful confirmation in another request.
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId && p.PaymentStatus != "PAID")
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentStatus, "FAILED"));
                }

                return Ok(new { received = true });
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid JSON received at Yoco webhook.");
                return BadRequest("Invalid webhook payload.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Yoco webhook.");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        private bool VerifyYocoWebhookSignature(string rawBody)
        {
            var webhookId = Request.Headers["webhook-id"].ToString();
            var timestamp = Request.Headers["webhook-timestamp"].ToString();
            var signatureHeader = Request.Headers["webhook-signature"].ToString();

            if (string.IsNullOrWhiteSpace(webhookId) ||
                string.IsNullOrWhiteSpace(timestamp) ||
                string.IsNullOrWhiteSpace(signatureHeader) ||
                !long.TryParse(timestamp, out var timestampSeconds))
                return false;

            var nowSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (timestampSeconds < nowSeconds - 300 || timestampSeconds > nowSeconds + 300)
                return false;

            try
            {
                var secret = _yocoSettings.WebhookSecret;
                if (secret.StartsWith("whsec_", StringComparison.Ordinal))
                    secret = secret.Substring("whsec_".Length);

                var key = Convert.FromBase64String(secret);
                var signedContent = $"{webhookId}.{timestamp}.{rawBody}";
                using var hmac = new HMACSHA256(key);
                var expected = Convert.ToBase64String(
                    hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent)));

                foreach (var item in signatureHeader.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = item.Split(',', 2);
                    if (parts.Length == 2 &&
                        parts[0] == "v1" &&
                        CryptographicOperations.FixedTimeEquals(
                            Encoding.UTF8.GetBytes(parts[1]),
                            Encoding.UTF8.GetBytes(expected)))
                        return true;
                }
            }
            catch (FormatException)
            {
                _logger.LogError("Yoco webhook secret is not a valid base64 signing secret.");
            }

            return false;
        }

        private static string? FindCheckoutId(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    if ((property.Name.Equals("id", StringComparison.OrdinalIgnoreCase) ||
                         property.Name.Equals("checkoutId", StringComparison.OrdinalIgnoreCase) ||
                         property.Name.Equals("checkout_id", StringComparison.OrdinalIgnoreCase)) &&
                        property.Value.ValueKind == JsonValueKind.String)
                    {
                        var value = property.Value.GetString();
                        if (!string.IsNullOrWhiteSpace(value) &&
                            value.StartsWith("ch_", StringComparison.Ordinal))
                            return value;
                    }

                    var nestedResult = FindCheckoutId(property.Value);
                    if (nestedResult != null)
                        return nestedResult;
                }
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in element.EnumerateArray())
                {
                    var nestedResult = FindCheckoutId(item);
                    if (nestedResult != null)
                        return nestedResult;
                }
            }

            return null;
        }

        private async Task<bool> RecordVerifiedYocoPaymentAsync(
            Payment payment,
            string providerCheckoutReference)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var currentOrderStatus = await _context.Orders
                .Where(o => o.OrderId == payment.OrderId)
                .Select(o => o.Status)
                .SingleOrDefaultAsync();

            if (currentOrderStatus == null)
                throw new InvalidOperationException("The order for the verified payment no longer exists.");

            var orderWasCancelled = string.Equals(
                currentOrderStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase);

            if (orderWasCancelled)
            {
                var now = DateTime.UtcNow;
                var refundRecordCreated = await _context.Payments
                    .Where(p => p.PaymentId == payment.PaymentId &&
                                p.RefundStatus == "NOT_REQUIRED")
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.PaymentStatus, "PAID")
                        .SetProperty(p => p.TransactionReference, providerCheckoutReference)
                        .SetProperty(p => p.RefundStatus, "REQUIRED")
                        .SetProperty(p => p.RefundAmount, p => p.Amount)
                        .SetProperty(p => p.RefundProvider, "YOCO")
                        // The checkout ID identifies the original payment, not a refund.
                        // RefundProviderReference stays empty until a refund is actually initiated.
                        .SetProperty(p => p.RefundProviderReference, (string?)null)
                        .SetProperty(p => p.RefundRequiredAt, now)
                        .SetProperty(p => p.RefundRequestedAt, (DateTime?)null)
                        .SetProperty(p => p.RefundCompletedAt, (DateTime?)null)
                        .SetProperty(p => p.RefundFailedAt, (DateTime?)null)
                        .SetProperty(p => p.RequiresReconciliation, true)
                        .SetProperty(p => p.ReconciliationReason,
                            "Yoco confirmed payment after the order was cancelled; refund required.")
                        .SetProperty(p => p.ReconciliationOpenedAt, now)
                        .SetProperty(p => p.ReconciliationResolvedAt, (DateTime?)null)
                        .SetProperty(p => p.ReconciliationResolutionNotes, (string?)null));

                if (refundRecordCreated > 0)
                {
                    _context.PaymentReconciliationEvents.Add(new PaymentReconciliationEvent
                    {
                        PaymentId = payment.PaymentId,
                        ActorUserId = null,
                        ActorRole = "YOCO_WEBHOOK",
                        EventType = "REFUND_REQUIRED",
                        RefundStatus = "REQUIRED",
                        ProviderReference = providerCheckoutReference,
                        Details = "Provider-confirmed Yoco payment arrived after order cancellation. Refund review is required; no automatic refund was issued.",
                        CreatedAt = now
                    });

                    await _context.SaveChangesAsync();
                }
                else
                {
                    // A duplicate webhook/confirmation may arrive after another
                    // request has already opened the refund record. Keep the payment
                    // fact current without duplicating the initial transition event.
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentStatus, "PAID")
                            .SetProperty(p => p.TransactionReference, providerCheckoutReference));
                }
            }
            else
            {
                await _context.Payments
                    .Where(p => p.PaymentId == payment.PaymentId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.PaymentStatus, "PAID")
                        .SetProperty(p => p.TransactionReference, providerCheckoutReference));
            }

            await transaction.CommitAsync();
            return orderWasCancelled;
        }

        [Authorize(Roles = "Customer")]
        [HttpPost("yoco/{orderId}/confirm")]
        public async Task<IActionResult> ConfirmYocoPayment(int orderId)
        {
            if (orderId <= 0)
                return BadRequest("Invalid order ID.");

            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == orderId &&
                    o.UserId == userId.Value);

            if (order == null)
                return NotFound("Order not found.");

            if (order.Payment == null)
                return NotFound("Payment not found for this order.");

            var payment = order.Payment;

            if (string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                return BadRequest("Yoco checkout ID is missing.");

            // Already confirmed
            if (payment.PaymentStatus == "PAID")
            {
                return Ok(new
                {
                    message = "Payment has already been confirmed.",
                    orderId = order.OrderId,
                    paymentId = payment.PaymentId,
                    paymentStatus = payment.PaymentStatus,
                    orderStatus = order.Status
                });
            }

            try
            {
                var checkout =
                    await _yocoPaymentService.GetCheckoutStatusAsync(
                        payment.YocoCheckoutId);

                if (!string.Equals(checkout.Id, payment.YocoCheckoutId, StringComparison.Ordinal))
                    return Conflict("The payment provider returned a different checkout.");

                var expectedAmountInCents = (int)Math.Round(payment.Amount * 100);
                if (checkout.Amount != expectedAmountInCents ||
                    !string.Equals(checkout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Yoco checkout amount/currency mismatch for payment {PaymentId}", payment.PaymentId);
                    return Conflict("The payment details could not be verified. Please contact support.");
                }

                if (string.Equals(
                    checkout.Status,
                    "completed",
                    StringComparison.OrdinalIgnoreCase))
                {
                    // The provider may confirm payment after a cancellation race.
                    // Never reopen/fulfil a cancelled order; persist refund tracking.
                    // The helper re-reads order status within a serializable transaction,
                    // records any required refund, and never changes the order status.
                    var orderWasCancelled = await RecordVerifiedYocoPaymentAsync(payment, checkout.Id);

                    if (orderWasCancelled)
                    {
                        _logger.LogCritical(
                            "RECONCILIATION REQUIRED: Yoco confirmed payment {PaymentId} for cancelled order {OrderId}. Refund tracking was opened; do not fulfil the order.",
                            payment.PaymentId,
                            order.OrderId);
                    }

                    await _context.Entry(payment).ReloadAsync();

                    return Ok(new
                    {
                        message = "Payment confirmed successfully.",
                        orderId = order.OrderId,
                        paymentId = payment.PaymentId,
                        paymentStatus = payment.PaymentStatus,
                        orderStatus = order.Status,
                        yocoCheckoutId = payment.YocoCheckoutId
                    });
                }

                if (string.Equals(
                    checkout.Status,
                    "failed",
                    StringComparison.OrdinalIgnoreCase))
                {
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId && p.PaymentStatus != "PAID")
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentStatus, "FAILED"));

                    await _context.Entry(payment).ReloadAsync();

                    return Ok(new
                    {
                        message = payment.PaymentStatus == "PAID"
                            ? "Payment was already confirmed successfully."
                            : "Yoco payment failed.",
                        orderId = order.OrderId,
                        paymentId = payment.PaymentId,
                        paymentStatus = payment.PaymentStatus,
                        orderStatus = order.Status
                    });
                }

                if (string.Equals(
                    checkout.Status,
                    "cancelled",
                    StringComparison.OrdinalIgnoreCase))
                {
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId && p.PaymentStatus != "PAID")
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentStatus, "FAILED"));

                    await _context.Entry(payment).ReloadAsync();

                    return Ok(new
                    {
                        message = payment.PaymentStatus == "PAID"
                            ? "Payment was already confirmed successfully."
                            : "Yoco payment was cancelled.",
                        orderId = order.OrderId,
                        paymentId = payment.PaymentId,
                        paymentStatus = payment.PaymentStatus,
                        orderStatus = order.Status
                    });
                }

                return Ok(new
                {
                    message = "Payment is still being processed.",
                    orderId = order.OrderId,
                    paymentId = payment.PaymentId,
                    paymentStatus = payment.PaymentStatus,
                    yocoStatus = checkout.Status,
                    orderStatus = order.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yoco payment confirmation failed for order {OrderId}", orderId);
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new { message = "Unable to verify the payment right now. Please try again later." });
            }
        }
    }
}