using GrabnBite.Data;
using GrabnBite.DTOs.Payment;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrabnBite.Services;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly YocoPaymentService _yocoPaymentService;

        public PaymentController(
            AppDbContext context,
            YocoPaymentService yocoPaymentService)
        {
            _context = context;
            _yocoPaymentService = yocoPaymentService;
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

            // --------------------------------------------------------
            // Prevent duplicate payment
            // --------------------------------------------------------

            if (order.Payment != null)
            {
                return BadRequest(
                    "A payment already exists for this order.");
            }

            // --------------------------------------------------------
            // Create payment record
            // --------------------------------------------------------

            var payment = new Payment
            {
                OrderId = order.OrderId,

                // Always use amount stored on order.
                Amount = order.TotalAmount,

                PaymentStatus = "INITIATED",

                PaymentMethod = "YOCO",

                PaymentReference =
                    $"GNB-YOCO-{Guid.NewGuid():N}"
                        .Substring(0, 18)
                        .ToUpper(),

                PaymentDate = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            // --------------------------------------------------------
            // Create Yoco checkout
            // --------------------------------------------------------

            var successUrl =
                $"https://localhost:7127/api/Payment/yoco/success?orderId={order.OrderId}";

            var cancelUrl =
                $"https://localhost:7127/api/Payment/yoco/cancel?orderId={order.OrderId}";

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
                payment.PaymentStatus = "FAILED";

                await _context.SaveChangesAsync();

                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Unable to create Yoco checkout.",
                        error = ex.Message
                    });
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
        // MOCK PAYMENT SUCCESS
        // DEVELOPMENT / TESTING ONLY
        //
        // POST: /api/Payment/{orderId}/simulate-success
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpPost("{orderId}/simulate-success")]
        public async Task<IActionResult> SimulatePaymentSuccess(
            int orderId)
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

            if (payment.PaymentStatus == "PAID")
            {
                return BadRequest(
                    "This payment has already been completed.");
            }

            if (payment.PaymentStatus != "PENDING")
            {
                return BadRequest(
                    "Only pending payments can be completed.");
            }

            payment.TransactionReference =
                $"MOCK-{Guid.NewGuid():N}"
                    .Substring(0, 18)
                    .ToUpper();

            payment.PaymentStatus = "PAID";

            // Order remains PENDING.
            // Restaurant still needs to accept the order.
            payment.Order.Status = "PENDING";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment completed successfully.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                amount = payment.Amount,
                paymentStatus = payment.PaymentStatus,
                transactionReference =
                    payment.TransactionReference,
                orderStatus = payment.Order.Status
            });
        }

        // ============================================================
        // MOCK PAYMENT FAILURE
        // DEVELOPMENT / TESTING ONLY
        //
        // POST: /api/Payment/{orderId}/simulate-failure
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpPost("{orderId}/simulate-failure")]
        public async Task<IActionResult> SimulatePaymentFailure(
            int orderId)
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

            if (payment.PaymentStatus == "PAID")
            {
                return BadRequest(
                    "A completed payment cannot be marked as failed.");
            }

            if (payment.PaymentStatus != "PENDING")
            {
                return BadRequest(
                    "Only pending payments can fail.");
            }

            payment.PaymentStatus = "FAILED";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment failed.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                paymentStatus = payment.PaymentStatus
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
                message = "Yoco payment page completed.",
                orderId = orderId,
                note = "Payment confirmation will be implemented with the Yoco webhook."
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
    }
}