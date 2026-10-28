using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.Models.Entities;
using GrabnBite.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    /// <summary>
    /// Local development payment simulator. Every action is disabled outside Development.
    /// It never contacts Yoco, Stripe, or any other payment provider.
    /// </summary>
    [ApiController]
    [Route("api/fake-payments")]
    [Authorize(Roles = "Customer")]
    public sealed class FakePaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly FakePaymentGateway _gateway;
        private readonly IWebHostEnvironment _environment;

        public FakePaymentController(
            AppDbContext context,
            FakePaymentGateway gateway,
            IWebHostEnvironment environment)
        {
            _context = context;
            _gateway = gateway;
            _environment = environment;
        }

        private int? CurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }

        private IActionResult? EnsureDevelopmentOnly()
        {
            return _environment.IsDevelopment()
                ? null
                : NotFound();
        }

        /// <summary>Creates a pending fake payment for the authenticated customer's order.</summary>
        [HttpPost("{orderId:int}")]
        public async Task<IActionResult> Create(int orderId)
        {
            var blocked = EnsureDevelopmentOnly();
            if (blocked != null) return blocked;

            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();
            if (orderId <= 0) return BadRequest("Invalid order ID.");

            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId.Value);

            if (order == null) return NotFound("Order not found.");
            if (order.Status == "CANCELLED")
                return BadRequest("A cancelled order cannot be paid.");
            if (order.TotalAmount <= 0)
                return BadRequest("Order amount must be greater than zero.");
            if (order.Payment != null)
            {
                // A failed fake attempt can be retried on the same payment row because
                // the current schema intentionally allows one payment record per order.
                if (order.Payment.PaymentMethod == "FAKE" &&
                    order.Payment.PaymentStatus == "FAILED")
                {
                    var retryReference = $"GNB-FAKE-{Guid.NewGuid():N}".Substring(0, 18).ToUpperInvariant();
                    var retryStarted = await _context.Payments
                        .Where(p => p.PaymentId == order.Payment.PaymentId &&
                                    p.PaymentMethod == "FAKE" &&
                                    p.PaymentStatus == "FAILED")
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.PaymentStatus, "PENDING")
                            .SetProperty(p => p.PaymentReference, retryReference)
                            .SetProperty(p => p.TransactionReference, (string?)null)
                            .SetProperty(p => p.PaymentDate, DateTime.UtcNow));

                    if (retryStarted == 0)
                        return Conflict("A fake payment retry is already in progress. Refresh and check its status.");

                    await _context.Entry(order.Payment).ReloadAsync();

                    return Ok(new
                    {
                        message = "Fake payment retry created. No money has been charged.",
                        paymentId = order.Payment.PaymentId,
                        orderId = order.Payment.OrderId,
                        amount = order.Payment.Amount,
                        paymentStatus = order.Payment.PaymentStatus,
                        paymentMethod = order.Payment.PaymentMethod,
                        paymentReference = order.Payment.PaymentReference
                    });
                }

                return Conflict("A payment already exists for this order. A paid or in-progress payment cannot be replaced.");
            }

            var payment = new Payment
            {
                OrderId = order.OrderId,
                Amount = order.TotalAmount,
                PaymentStatus = "PENDING",
                PaymentMethod = "FAKE",
                PaymentReference = $"GNB-FAKE-{Guid.NewGuid():N}".Substring(0, 18).ToUpperInvariant(),
                PaymentDate = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // The unique OrderId index protects against concurrent create requests.
                // Convert that race into a predictable conflict instead of a server error.
                return Conflict("A payment was created for this order by another request. Refresh and check its status.");
            }

            return Ok(new
            {
                message = "Fake payment created. No money has been charged.",
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                amount = payment.Amount,
                paymentStatus = payment.PaymentStatus,
                paymentMethod = payment.PaymentMethod,
                paymentReference = payment.PaymentReference,
                nextStep = $"POST /api/fake-payments/{payment.PaymentId}/complete with {{ \"succeed\": true }} or {{ \"succeed\": false }}"
            });
        }

        /// <summary>Completes a fake payment as success or failure. A terminal result cannot be changed.</summary>
        [HttpPost("{paymentId:int}/complete")]
        public async Task<IActionResult> Complete(
            int paymentId,
            [FromBody] CompleteFakePaymentRequest request)
        {
            var blocked = EnsureDevelopmentOnly();
            if (blocked != null) return blocked;

            var userId = CurrentUserId();
            if (userId == null) return Unauthorized();
            if (paymentId <= 0) return BadRequest("Invalid payment ID.");
            if (request == null) return BadRequest("A fake payment result is required.");

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p =>
                    p.PaymentId == paymentId &&
                    p.Order.UserId == userId.Value &&
                    p.PaymentMethod == "FAKE");

            if (payment == null) return NotFound("Fake payment not found.");
            if (payment.Order.Status == "CANCELLED")
                return BadRequest("A cancelled order cannot be paid.");

            if (payment.PaymentStatus == "PAID" || payment.PaymentStatus == "FAILED")
            {
                return Ok(new
                {
                    message = "This fake payment already has a final result; it was not changed.",
                    paymentId = payment.PaymentId,
                    paymentStatus = payment.PaymentStatus,
                    orderId = payment.OrderId
                });
            }

            var result = _gateway.Complete(
                payment.Amount,
                request.Succeed,
                payment.PaymentReference ?? $"PAY-{payment.PaymentId}");

            // Only one concurrent completion may change a pending fake payment.
            // A second request cannot flip PAID to FAILED (or vice versa).
            var completed = await _context.Payments
                .Where(p => p.PaymentId == payment.PaymentId &&
                            p.PaymentMethod == "FAKE" &&
                            p.PaymentStatus == "PENDING")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.PaymentStatus, result.Succeeded ? "PAID" : "FAILED")
                    .SetProperty(p => p.TransactionReference, result.TransactionReference)
                    .SetProperty(p => p.PaymentDate, DateTime.UtcNow));

            await _context.Entry(payment).ReloadAsync();

            if (completed == 0)
            {
                return Ok(new
                {
                    message = "This fake payment was completed by another request; its final result was preserved.",
                    paymentId = payment.PaymentId,
                    orderId = payment.OrderId,
                    paymentStatus = payment.PaymentStatus,
                    transactionReference = payment.TransactionReference,
                    orderStatus = payment.Order.Status
                });
            }

            return Ok(new
            {
                message = result.Message,
                paymentId = payment.PaymentId,
                orderId = payment.OrderId,
                amount = payment.Amount,
                paymentStatus = payment.PaymentStatus,
                transactionReference = payment.TransactionReference,
                orderStatus = payment.Order.Status
            });
        }
    }

    public sealed class CompleteFakePaymentRequest
    {
        public bool Succeed { get; set; }
    }
}
