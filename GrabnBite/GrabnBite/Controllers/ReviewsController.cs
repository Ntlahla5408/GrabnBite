using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.DTOs.Review;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var userId) ? userId : null;
        }

        /// <summary>Public restaurant reviews, newest first.</summary>
        [AllowAnonymous]
        [HttpGet("restaurant/{restaurantId:int}")]
        public async Task<IActionResult> GetRestaurantReviews(int restaurantId)
        {
            if (restaurantId <= 0)
                return BadRequest("A valid restaurant ID is required.");

            var restaurantExists = await _context.Restaurants
                .AnyAsync(r => r.RestaurantId == restaurantId);

            if (!restaurantExists)
                return NotFound("Restaurant not found.");

            var reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.RestaurantId == restaurantId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    reviewId = r.ReviewId,
                    restaurantId = r.RestaurantId,
                    orderId = r.OrderId,
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt,
                    customerFirstName = r.User.FirstName
                })
                .ToListAsync();

            return Ok(new
            {
                restaurantId,
                reviewCount = reviews.Count,
                averageRating = reviews.Count == 0
                    ? (double?)null
                    : Math.Round(reviews.Average(r => r.rating), 2),
                reviews
            });
        }

        /// <summary>
        /// A customer may review only their own delivered order, once.
        /// The restaurant is derived from the order, never trusted from the client.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (dto == null)
                return BadRequest("Review data is required.");

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var order = await _context.Orders
                .Include(o => o.Review)
                .FirstOrDefaultAsync(o =>
                    o.OrderId == dto.OrderId &&
                    o.UserId == userId.Value);

            if (order == null)
                return NotFound("Order not found.");

            if (!string.Equals(order.Status, "DELIVERED", StringComparison.OrdinalIgnoreCase))
                return BadRequest("You can review an order only after it has been delivered.");

            if (order.Review != null)
                return Conflict("This order has already been reviewed.");

            var review = new Review
            {
                UserId = userId.Value,
                RestaurantId = order.RestaurantId,
                OrderId = order.OrderId,
                Rating = dto.Rating,
                Comment = dto.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            if (string.IsNullOrWhiteSpace(review.Comment))
                return BadRequest("A review comment is required.");

            _context.Reviews.Add(review);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // The unique OrderId index prevents duplicate reviews if two
                // requests race after both pass the application-level check.
                if (await _context.Reviews.AnyAsync(r => r.OrderId == order.OrderId))
                    return Conflict("This order has already been reviewed.");

                throw;
            }

            return CreatedAtAction(
                nameof(GetRestaurantReviews),
                new { restaurantId = review.RestaurantId },
                new
                {
                    message = "Review submitted successfully.",
                    reviewId = review.ReviewId,
                    orderId = review.OrderId,
                    restaurantId = review.RestaurantId,
                    rating = review.Rating,
                    comment = review.Comment,
                    createdAt = review.CreatedAt
                });
        }

        /// <summary>Get the authenticated customer's review for one of their orders.</summary>
        [Authorize(Roles = "Customer")]
        [HttpGet("order/{orderId:int}")]
        public async Task<IActionResult> GetMyOrderReview(int orderId)
        {
            if (orderId <= 0)
                return BadRequest("A valid order ID is required.");

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var review = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.OrderId == orderId && r.UserId == userId.Value)
                .Select(r => new
                {
                    reviewId = r.ReviewId,
                    orderId = r.OrderId,
                    restaurantId = r.RestaurantId,
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (review == null)
                return NotFound("No review exists for this order.");

            return Ok(review);
        }
    }
}
