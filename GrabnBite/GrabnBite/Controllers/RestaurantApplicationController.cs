using GrabnBite.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Restaurant")]
    public class RestaurantApplicationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RestaurantApplicationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/RestaurantApplication/my-applications
        // Returns only the authenticated restaurant account's applications.
        [HttpGet("my-applications")]
        public async Task<IActionResult> GetMyApplications(
            CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var applications = await _context.RestaurantApplications
                .AsNoTracking()
                .Where(application => application.UserId == userId)
                .OrderByDescending(application => application.UpdatedAt)
                .Select(application => new
                {
                    application.RestaurantApplicationId,
                    application.ApplicationReference,
                    status = application.Status.ToString(),
                    application.TradingName,
                    application.RegisteredBusinessName,
                    application.SubmittedAt,
                    application.CreatedAt,
                    application.UpdatedAt,
                    application.DocumentsRequestedMessage,
                    application.RejectionReason,
                    hasOperationalRestaurant = application.Restaurant != null
                })
                .ToListAsync(cancellationToken);

            return Ok(applications);
        }
    }
}
