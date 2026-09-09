using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.DTOs.Payment;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Customer")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // ============================================================
        // CREATE PAYMENT
        // ============================================================

        [HttpPost("{orderId}")]
        public async Task<IActionResult> CreatePayment(
            int orderId,
            CreatePaymentDto dto)
        {
            var userId = GetCurrentUserId();

            // --------------------------------------------------------
            // Validate payment method
            // --------------------------------------------------------

            var validMethods = new[]
            {
                "CARD",
                "EFT",
                "CASH"
            };

            if (!validMethods.Contains(
                    dto.PaymentMethod.ToUpper()))
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
            // Ensure customer owns order
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

                // Always use amount from the order
                Amount = order.TotalAmount,

                PaymentStatus = "PENDING",

                PaymentMethod =
                    dto.PaymentMethod.ToUpper(),

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
                TransactionReference =
                    payment.TransactionReference,
                PaymentDate = payment.PaymentDate
            });
        }

        // ============================================================
        // GET PAYMENT
        // ============================================================

        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetPayment(int orderId)
        {
            var userId = GetCurrentUserId();

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

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
                TransactionReference =
                    payment.TransactionReference,
                PaymentDate = payment.PaymentDate
            });
        }

        // ============================================================
        // MOCK PAYMENT SUCCESS
        // ============================================================
        //
        // This simulates the payment gateway confirming payment.
        // We will replace this with a real gateway webhook later.
        // ============================================================

        [HttpPost("{orderId}/simulate-success")]
        public async Task<IActionResult> SimulatePaymentSuccess(
            int orderId)
        {
            var userId = GetCurrentUserId();

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            if (payment.Order.UserId != userId)
            {
                return Forbid();
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

            // Simulated gateway transaction reference
            payment.TransactionReference =
                $"MOCK-{Guid.NewGuid():N}"
                    .Substring(0, 18)
                    .ToUpper();

            payment.PaymentStatus = "PAID";

            // Payment successful
            // Order remains PENDING because the restaurant
            // still needs to accept it.
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
        // ============================================================

        [HttpPost("{orderId}/simulate-failure")]
        public async Task<IActionResult> SimulatePaymentFailure(
            int orderId)
        {
            var userId = GetCurrentUserId();

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.OrderId == orderId);

            if (payment == null)
            {
                return NotFound(
                    "No payment exists for this order.");
            }

            if (payment.Order.UserId != userId)
            {
                return Forbid();
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
    }
}