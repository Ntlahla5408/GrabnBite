using GrabnBite.Data;
using GrabnBite.DTOs.Payment;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrabnBite.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

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

            await _context.SaveChangesAsync();

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

            await _context.SaveChangesAsync();

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

            successUrl = $"{successUrl.TrimEnd('/') }?orderId={order.OrderId}";
            cancelUrl = $"{cancelUrl.TrimEnd('/') }?orderId={order.OrderId}";

            try
            {
                var checkout =
                    await _yocoPaymentService.CreateCheckoutAsync(
                        payment.Amount,
                        "ZAR",
                        successUrl,
                        cancelUrl);

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
                // Preserve a failed attempt for reconciliation. If Yoco created
                // a checkout but the response was lost, do not assume no charge.
                payment.PaymentStatus = "FAILED";
                await _context.SaveChangesAsync();
                _logger.LogError(ex, "Yoco checkout creation failed for order {OrderId}", orderId);

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
        // GET: /api/Payment/yoco/success
        // ============================================================

        [AllowAnonymous]
        [HttpGet("yoco/success")]
        public IActionResult YocoSuccess(int orderId)
        {
            return Ok(new
            {
                message = "Payment return received. This page does not confirm payment.",
                orderId = orderId,
                paymentStatusMustBeVerified = true
            });
        }

        // ============================================================
        // YOCO CANCEL REDIRECT
        // GET: /api/Payment/yoco/cancel
        // ============================================================

        [AllowAnonymous]
        [HttpGet("yoco/cancel")]
        public IActionResult YocoCancel(int orderId)
        {
            return Ok(new
            {
                message = "Yoco payment was cancelled.",
                orderId = orderId
            });
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

                Console.WriteLine(
                    $"YOCO CHECKOUT STATUS: {checkout.Status}");

                if (string.Equals(
                    checkout.Status,
                    "completed",
                    StringComparison.OrdinalIgnoreCase))
                {
                    payment.PaymentStatus = "PAID";

                    payment.TransactionReference =
                        checkout.Id;

                    order.Status = "PENDING";

                    await _context.SaveChangesAsync();

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
                    payment.PaymentStatus = "FAILED";

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Yoco payment failed.",
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
                    payment.PaymentStatus = "FAILED";

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Yoco payment was cancelled.",
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