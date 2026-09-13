using GrabnBite.Data;
using GrabnBite.DTOs.Payment;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // CREATE PAYMENT
        // POST: /api/Payment/{userId}/{orderId}
        // ============================================================

        [HttpPost("{userId}/{orderId}")]
        public async Task<IActionResult> CreatePayment(
            int userId,
            int orderId,
            CreatePaymentDto dto)
        {
            // --------------------------------------------------------
            // Validate user ID
            // --------------------------------------------------------

            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            // --------------------------------------------------------
            // Validate order ID
            // --------------------------------------------------------

            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            // --------------------------------------------------------
            // Validate payment method
            // --------------------------------------------------------

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
            // Find order
            // --------------------------------------------------------

            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // --------------------------------------------------------
            // Ensure order belongs to supplied user
            // --------------------------------------------------------

            if (order.UserId != userId)
            {
                return Forbid();
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

                // Always use amount from the order.
                // Never trust an amount from the frontend.
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
        // GET PAYMENT
        // GET: /api/Payment/{userId}/{orderId}
        // ============================================================

        [HttpGet("{userId}/{orderId}")]
        public async Task<IActionResult> GetPayment(
            int userId,
            int orderId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            // --------------------------------------------------------
            // Ensure payment belongs to user's order
            // --------------------------------------------------------

            if (payment.Order.UserId != userId)
            {
                return Forbid();
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
        // MOCK PAYMENT SUCCESS
        // POST:
        // /api/Payment/{userId}/{orderId}/simulate-success
        // ============================================================

        [HttpPost("{userId}/{orderId}/simulate-success")]
        public async Task<IActionResult> SimulatePaymentSuccess(
            int userId,
            int orderId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            // --------------------------------------------------------
            // Ensure payment belongs to user's order
            // --------------------------------------------------------

            if (payment.Order.UserId != userId)
            {
                return Forbid();
            }

            // --------------------------------------------------------
            // Prevent duplicate payment completion
            // --------------------------------------------------------

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

            // --------------------------------------------------------
            // Simulate gateway transaction reference
            // --------------------------------------------------------

            payment.TransactionReference =
                $"MOCK-{Guid.NewGuid():N}"
                    .Substring(0, 18)
                    .ToUpper();

            payment.PaymentStatus = "PAID";

            // --------------------------------------------------------
            // Payment succeeded.
            //
            // Order stays PENDING because the restaurant still
            // needs to accept the order.
            // --------------------------------------------------------

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
        // POST:
        // /api/Payment/{userId}/{orderId}/simulate-failure
        // ============================================================

        [HttpPost("{userId}/{orderId}/simulate-failure")]
        public async Task<IActionResult> SimulatePaymentFailure(
            int userId,
            int orderId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (orderId <= 0)
            {
                return BadRequest("Invalid order ID.");
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            // --------------------------------------------------------
            // Ensure payment belongs to user's order
            // --------------------------------------------------------

            if (payment.Order.UserId != userId)
            {
                return Forbid();
            }

            // --------------------------------------------------------
            // Prevent changing completed payment
            // --------------------------------------------------------

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
    }
}