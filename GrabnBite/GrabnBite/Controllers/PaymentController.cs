using Npgsql;
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

                if (!string.Equals(payment.PaymentMethod, "YOCO", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("A different payment method is already recorded for this order.");

                if (string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
                {
                    // The mobile client can move to its verification screen after a
                    // lost response without creating or replacing another checkout.
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

                if (!string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                {
                    try
                    {
                        var previousCheckout = await _yocoPaymentService.GetCheckoutStatusAsync(payment.YocoCheckoutId);
                        if (!string.Equals(previousCheckout.Id, payment.YocoCheckoutId, StringComparison.Ordinal) ||
                            previousCheckout.Amount != (int)Math.Round(payment.Amount * 100) ||
                            !string.Equals(previousCheckout.Currency, "ZAR", StringComparison.OrdinalIgnoreCase))
                            return Conflict("The previous Yoco checkout does not match this order. Contact support before retrying.");

                        var terminalFailure =
                            string.Equals(previousCheckout.Status, "failed", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(previousCheckout.Status, "cancelled", StringComparison.OrdinalIgnoreCase);

                        if (string.Equals(previousCheckout.Status, "completed", StringComparison.OrdinalIgnoreCase))
                        {
                            var orderWasCancelled = await RecordVerifiedYocoPaymentAsync(payment, previousCheckout.Id);
                            await _context.Entry(payment).ReloadAsync();

                            if (orderWasCancelled)
                            {
                                _logger.LogCritical(
                                    "RECONCILIATION REQUIRED: Yoco confirmed payment {PaymentId} for cancelled order {OrderId}. Refund tracking was opened; do not fulfil the order.",
                                    payment.PaymentId,
                                    payment.OrderId);
                                return Conflict("Yoco confirmed payment after the order was cancelled. Refund review is required; do not retry payment.");
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

                        if (!terminalFailure)
                        {
                            // A retry after a lost HTTP response should resume the same
                            // checkout, not create a second charge or leave the customer
                            // stuck at a conflict screen.
                            if (Uri.TryCreate(previousCheckout.RedirectUrl, UriKind.Absolute, out var existingRedirectUri) &&
                                existingRedirectUri.Scheme == Uri.UriSchemeHttps)
                            {
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
                                    RedirectUrl = previousCheckout.RedirectUrl
                                });
                            }

                            return Conflict("A Yoco checkout is still active, but its secure redirect URL could not be recovered. Check payment status before trying again.");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not safely reconcile prior Yoco checkout for order {OrderId}", orderId);
                        return Conflict("The previous payment could not be verified. Please try again later or contact support.");
                    }
                }

                if (!string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                {
                    // Claim the retry atomically. Two requests can both observe the
                    // same failed checkout at Yoco, but only one may rotate the
                    // idempotency key and detach that checkout from this payment.
                    var previousCheckoutId = payment.YocoCheckoutId;
                    var previousPaymentReference = payment.PaymentReference;
                    var newPaymentReference = $"GNB-YOCO-{Guid.NewGuid():N}".Substring(0, 18).ToUpper();
                    // Keep the old checkout ID in the append-only reconciliation trail
                    // before detaching it. A delayed success webhook must still be resolvable.
                    await using var retryTransaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
                    var claimedRetry = await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId &&
                                    p.PaymentStatus != "PAID" &&
                                    p.YocoCheckoutId == previousCheckoutId &&
                                    p.PaymentReference == previousPaymentReference)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentReference, newPaymentReference)
                            .SetProperty(p => p.PaymentStatus, "INITIATED")
                            .SetProperty(p => p.YocoCheckoutId, (string?)null)
                            .SetProperty(p => p.TransactionReference, (string?)null)
                            .SetProperty(p => p.PaymentDate, DateTime.UtcNow));

                    if (claimedRetry != 1)
                    {
                        await retryTransaction.RollbackAsync();
                        return Conflict("Another request has already started a payment retry. Refresh and check the latest payment status.");
                    }

                    _context.PaymentReconciliationEvents.Add(new PaymentReconciliationEvent
                    {
                        PaymentId = payment.PaymentId,
                        ActorUserId = userId.Value,
                        ActorRole = "CUSTOMER",
                        EventType = "YOCO_CHECKOUT_RETRY_STARTED",
                        RefundStatus = payment.RefundStatus,
                        ProviderReference = previousCheckoutId,
                        Details = "The previous Yoco checkout was verified as failed/cancelled and detached for retry. Retain this checkout reference to reconcile any delayed provider notification.",
                        CreatedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();
                    await retryTransaction.CommitAsync();
                    await _context.Entry(payment).ReloadAsync();
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
                var checkoutPaymentReference = payment.PaymentReference
                    ?? throw new InvalidOperationException("Payment reference is missing.");
                var checkout = await _yocoPaymentService.CreateCheckoutAsync(
                    payment.Amount,
                    "ZAR",
                    successUrl,
                    cancelUrl,
                    checkoutPaymentReference);

                // Attach the provider checkout only if this payment attempt is still
                // current. A delayed success for an older checkout can mark the payment
                // PAID while this provider request is in flight; never then expose a
                // second checkout as though it were safe to complete.
                var checkoutAttached = await _context.Payments
                    .Where(p => p.PaymentId == payment.PaymentId &&
                                p.PaymentReference == checkoutPaymentReference &&
                                p.PaymentStatus != "PAID" &&
                                (p.YocoCheckoutId == null || p.YocoCheckoutId == checkout.Id))
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.YocoCheckoutId, checkout.Id));

                await _context.Entry(payment).ReloadAsync();

                if (checkoutAttached == 0 &&
                    string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(payment.TransactionReference, checkout.Id, StringComparison.Ordinal))
                {
                    // A concurrent request may have completed this exact checkout.
                    // Return the verified state without sending the customer back to it.
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

                if (checkoutAttached == 0 ||
                    string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(payment.TransactionReference, checkout.Id, StringComparison.Ordinal))
                {
                    await OpenYocoReconciliationAsync(
                        payment.PaymentId,
                        checkout.Id,
                        payment.RefundStatus,
                        "YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED",
                        "Yoco returned a checkout after the payment state or attempt reference changed. Verify whether this checkout can still be paid and reconcile any resulting charge before resolving.",
                        DateTime.UtcNow);

                    _logger.LogCritical(
                        "RECONCILIATION REQUIRED: Yoco checkout {CheckoutId} was created after payment {PaymentId} changed state; do not direct the customer to this checkout.",
                        checkout.Id,
                        payment.PaymentId);

                    return Conflict("The payment changed while checkout was being created. Do not continue with this checkout; refresh and check payment status.");
                }

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

            // Yoco must return to HTTPS. Some mobile browsers do not reliably
            // follow an HTTP redirect directly to a custom app scheme, so provide
            // an automatic app-link attempt plus a visible fallback link.
            // The app still verifies payment with Yoco before showing order details.
            var appUrl = $"grabnbitemobile://payment-success?orderId={orderId}";
            var html = $$"""
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Return to GrabnBite</title>
                  <style>
                    body { font-family: Arial, sans-serif; background: #f7f8fa; color: #071b2c; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; padding: 24px; box-sizing: border-box; }
                    main { max-width: 420px; background: #fff; border-radius: 18px; padding: 28px; text-align: center; box-shadow: 0 8px 28px rgba(7,27,44,.08); }
                    a { display: inline-block; margin-top: 18px; background: #f28c28; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 20px; border-radius: 10px; }
                    p { color: #5f6b75; line-height: 1.5; }
                  </style>
                </head>
                <body>
                  <main>
                    <h1>Payment submitted</h1>
                    <p>Return to GrabnBite to verify your payment and view your order status.</p>
                    <a href="{{appUrl}}">Open GrabnBite</a>
                    <p>If the app does not open automatically, tap the button above.</p>
                  </main>
                  <script>
                    window.location.href = "{{appUrl}}";
                  </script>
                </body>
                </html>
                """;

            return Content(html, "text/html; charset=utf-8");
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
        [RequestSizeLimit(1_048_576)]
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

                // Retries detach the old checkout from the active payment row. Resolve
                // that checkout through the durable retry event so a delayed success is
                // reconciled instead of being retried forever or silently discarded.
                if (payment == null)
                {
                    var retryEvent = await _context.PaymentReconciliationEvents
                        .AsNoTracking()
                        .Where(e => (e.EventType == "YOCO_CHECKOUT_RETRY_STARTED" ||
                                     e.EventType == "YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED") &&
                                    e.ProviderReference == checkoutId)
                        .OrderByDescending(e => e.CreatedAt)
                        .FirstOrDefaultAsync();

                    if (retryEvent != null)
                    {
                        payment = await _context.Payments
                            .Include(p => p.Order)
                            .FirstOrDefaultAsync(p => p.PaymentId == retryEvent.PaymentId);
                    }
                }

                // A webhook may arrive before the checkout ID has been saved, or it may
                // refer to a checkout for which no retry history exists. Ask Yoco to retry.
                if (payment == null)
                {
                    _logger.LogWarning("Received Yoco webhook for an unknown checkout; asking Yoco to retry.");
                    return StatusCode(StatusCodes.Status503ServiceUnavailable);
                }

                var checkout = await _yocoPaymentService.GetCheckoutStatusAsync(checkoutId);
                if (!string.Equals(checkout.Id, checkoutId, StringComparison.Ordinal) ||
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
                    // A delayed failure from a detached checkout must not fail the
                    // currently active retry. Only mutate state when IDs still match.
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId &&
                                    p.YocoCheckoutId == checkoutId &&
                                    p.PaymentStatus != "PAID")
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
            if (timestampSeconds < nowSeconds - 180 || timestampSeconds > nowSeconds + 180)
                return false;

            try
            {
                var configuredSecret = _yocoSettings.WebhookSecret;
                const string secretPrefix = "whsec_";
                if (!configuredSecret.StartsWith(secretPrefix, StringComparison.Ordinal) ||
                    configuredSecret.Length <= secretPrefix.Length)
                {
                    _logger.LogError("Yoco webhook signing secret is missing the required prefix or key material.");
                    return false;
                }

                var secret = configuredSecret.Substring(secretPrefix.Length);
                var key = Convert.FromBase64String(secret);
                if (key.Length == 0)
                {
                    _logger.LogError("Yoco webhook signing secret decoded to an empty key.");
                    return false;
                }

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

            var currentPayment = await _context.Payments
                .AsNoTracking()
                .Where(p => p.PaymentId == payment.PaymentId)
                .Select(p => new
                {
                    p.PaymentStatus,
                    p.YocoCheckoutId,
                    p.TransactionReference,
                    p.RefundStatus
                })
                .SingleOrDefaultAsync();

            if (currentPayment == null)
                throw new InvalidOperationException("The payment for the verified checkout no longer exists.");

            var now = DateTime.UtcNow;
            var orderWasCancelled = string.Equals(
                currentOrderStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase);
            var isActiveCheckout = string.Equals(
                currentPayment.YocoCheckoutId, providerCheckoutReference, StringComparison.Ordinal);
            var alreadyPaid = string.Equals(
                currentPayment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase);

            if (alreadyPaid)
            {
                // If a second checkout completed, do not replace the first recorded
                // transaction reference. Open a durable review item for a possible
                // duplicate charge, including when the second completion arrives late.
                if (!string.Equals(currentPayment.TransactionReference, providerCheckoutReference, StringComparison.Ordinal))
                {
                    await OpenYocoReconciliationAsync(
                        payment.PaymentId,
                        providerCheckoutReference,
                        currentPayment.RefundStatus,
                        "YOCO_MULTIPLE_CHECKOUTS_COMPLETED",
                        "Yoco confirmed more than one checkout for this payment. Verify the provider records for a possible duplicate charge; do not assume a refund has been issued.",
                        now);
                }

                if (orderWasCancelled && !string.Equals(currentPayment.RefundStatus, "SUCCEEDED", StringComparison.OrdinalIgnoreCase))
                {
                    await RequireYocoRefundAsync(payment.PaymentId, providerCheckoutReference, now);
                }
            }
            else if (!isActiveCheckout)
            {
                // The provider has confirmed a checkout that was detached during retry.
                // Record the charge fact, but force reconciliation because another checkout
                // may also have completed and the payment row can only hold one transaction.
                await _context.Payments
                    .Where(p => p.PaymentId == payment.PaymentId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.PaymentStatus, "PAID")
                        .SetProperty(p => p.TransactionReference, providerCheckoutReference));

                await OpenYocoReconciliationAsync(
                    payment.PaymentId,
                    providerCheckoutReference,
                    currentPayment.RefundStatus,
                    "YOCO_STALE_CHECKOUT_COMPLETED",
                    "A detached Yoco checkout completed after a retry began. Verify all checkout attempts for duplicate charges and reconcile the order before further action.",
                    now);

                if (orderWasCancelled)
                    await RequireYocoRefundAsync(payment.PaymentId, providerCheckoutReference, now);
            }
            else
            {
                await _context.Payments
                    .Where(p => p.PaymentId == payment.PaymentId &&
                                p.YocoCheckoutId == providerCheckoutReference &&
                                p.PaymentStatus != "PAID")
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.PaymentStatus, "PAID")
                        .SetProperty(p => p.TransactionReference, providerCheckoutReference));

                if (orderWasCancelled)
                    await RequireYocoRefundAsync(payment.PaymentId, providerCheckoutReference, now);
            }

            await transaction.CommitAsync();
            return orderWasCancelled;
        }

        private async Task OpenYocoReconciliationAsync(
            int paymentId,
            string providerCheckoutReference,
            string refundStatus,
            string eventType,
            string details,
            DateTime now)
        {
            // Fast path for ordinary webhook retries. The unique partial index below is
            // the authoritative guard against two concurrent deliveries passing this check.
            var eventExists = await _context.PaymentReconciliationEvents
                .AnyAsync(e => e.PaymentId == paymentId &&
                               e.EventType == eventType &&
                               e.ProviderReference == providerCheckoutReference);

            if (eventExists)
                return;

            var ownsTransaction = _context.Database.CurrentTransaction == null;
            await using var transaction = ownsTransaction
                ? await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable)
                : null;

            var reconciliationEvent = new PaymentReconciliationEvent
            {
                PaymentId = paymentId,
                ActorUserId = null,
                ActorRole = "YOCO_WEBHOOK",
                EventType = eventType,
                RefundStatus = refundStatus,
                ProviderReference = providerCheckoutReference,
                Details = details,
                CreatedAt = now
            };

            // Insert the idempotency record before changing the payment. If a concurrent
            // webhook won the unique-index race, no state is reopened by this delivery.
            _context.PaymentReconciliationEvents.Add(reconciliationEvent);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (
                ex.InnerException is PostgresException postgresException &&
                postgresException.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgresException.ConstraintName == "IX_PaymentReconciliationEvents_YocoEventIdempotency")
            {
                _context.Entry(reconciliationEvent).State = EntityState.Detached;

                if (transaction != null)
                    await transaction.RollbackAsync();

                // A concurrent delivery already recorded this exact event. Do not reopen
                // reconciliation or mutate payment state in response to the duplicate.
                return;
            }
            catch
            {
                _context.Entry(reconciliationEvent).State = EntityState.Detached;
                throw;
            }

            var updated = await _context.Payments
                .Where(p => p.PaymentId == paymentId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.RequiresReconciliation, true)
                    .SetProperty(p => p.ReconciliationReason, details)
                    .SetProperty(p => p.ReconciliationOpenedAt, p => p.ReconciliationOpenedAt ?? now)
                    .SetProperty(p => p.ReconciliationResolvedAt, (DateTime?)null)
                    .SetProperty(p => p.ReconciliationResolutionNotes, (string?)null));

            if (updated != 1)
                throw new InvalidOperationException($"Payment {paymentId} was not found while opening Yoco reconciliation.");

            if (transaction != null)
                await transaction.CommitAsync();
        }

        private async Task RequireYocoRefundAsync(
            int paymentId,
            string providerCheckoutReference,
            DateTime now)
        {
            var refundRecordCreated = await _context.Payments
                .Where(p => p.PaymentId == paymentId && p.RefundStatus == "NOT_REQUIRED")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PaymentStatus, "PAID")
                    .SetProperty(p => p.TransactionReference, providerCheckoutReference)
                    .SetProperty(p => p.RefundStatus, "REQUIRED")
                    .SetProperty(p => p.RefundAmount, p => p.Amount)
                    .SetProperty(p => p.RefundProvider, "YOCO")
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
                    PaymentId = paymentId,
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

            if (!string.Equals(payment.PaymentMethod, "YOCO", StringComparison.OrdinalIgnoreCase))
                return BadRequest("This payment was not created through Yoco.");

            // A verified historical checkout can be the recorded transaction even
            // when a retry detached the current checkout ID. Preserve that verified
            // result rather than requiring a current redirect/checkout reference.
            if (string.Equals(payment.PaymentStatus, "PAID", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new
                {
                    message = "Payment has already been confirmed.",
                    orderId = order.OrderId,
                    paymentId = payment.PaymentId,
                    paymentStatus = payment.PaymentStatus,
                    orderStatus = order.Status,
                    requiresReconciliation = payment.RequiresReconciliation,
                    refundStatus = payment.RefundStatus
                });
            }

            if (string.IsNullOrWhiteSpace(payment.YocoCheckoutId))
                return BadRequest("Yoco checkout ID is missing.");

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
                    // The payment helper checks cancellation using a fresh database read.
                    // Refresh the tracked order too so the response cannot claim an order
                    // is active when cancellation won the concurrent transaction.
                    await _context.Entry(order).ReloadAsync();

                    return Ok(new
                    {
                        message = "Payment confirmed successfully.",
                        orderId = order.OrderId,
                        paymentId = payment.PaymentId,
                        paymentStatus = payment.PaymentStatus,
                        orderStatus = order.Status,
                        yocoCheckoutId = payment.YocoCheckoutId,
                        requiresReconciliation = payment.RequiresReconciliation,
                        refundStatus = payment.RefundStatus
                    });
                }

                if (string.Equals(
                    checkout.Status,
                    "failed",
                    StringComparison.OrdinalIgnoreCase))
                {
                    await _context.Payments
                        .Where(p => p.PaymentId == payment.PaymentId &&
                                    p.YocoCheckoutId == checkout.Id &&
                                    p.PaymentStatus != "PAID")
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
                        .Where(p => p.PaymentId == payment.PaymentId &&
                                    p.YocoCheckoutId == checkout.Id &&
                                    p.PaymentStatus != "PAID")
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