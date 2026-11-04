using GrabnBite.Data;
using GrabnBite.DTOs.Driver;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DriverController : ControllerBase
    {
        private readonly AppDbContext _context;

    public DriverController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }

        // ============================================================
        // REGISTER DRIVER PROFILE
        // Driver only
        // POST: api/Driver
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPost]
        public IActionResult CreateDriver([FromBody] CreateDriverDto dto)
        {
            return Conflict(new
            {
                message = "Driver profiles are created only after a delivery partner application has been reviewed and approved. Complete your driver application first."
            });
        }

        // ============================================================
        // GET MY DRIVER PROFILE
        // Driver only
        // GET: api/Driver/me
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyDriverProfile()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId.Value);

            if (driver == null)
            {
                return NotFound(
                    "Driver profile not found.");
            }

            return Ok(new DriverResponseDto
            {
                DriverId = driver.DriverId,
                UserId = driver.UserId,
                VehicleType = driver.VehicleType,
                VehicleRegistration = driver.VehicleRegistration,
                IsOnline = driver.IsOnline,
                IsApproved = driver.IsApproved,
                CreatedAt = driver.CreatedAt
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllDrivers()
        {
            var drivers = await _context.Drivers
                .AsNoTracking()
                .Select(driver => new DriverResponseDto
                {
                    DriverId = driver.DriverId,
                    UserId = driver.UserId,
                    VehicleType = driver.VehicleType,
                    VehicleRegistration = driver.VehicleRegistration,
                    IsOnline = driver.IsOnline,
                    IsApproved = driver.IsApproved,
                    CreatedAt = driver.CreatedAt
                })
                .ToListAsync();

            return Ok(drivers);
        }

        // ============================================================
        // GO ONLINE
        // Driver only
        // PUT: api/Driver/online
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("online")]
        public async Task<IActionResult> GoOnline()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId.Value);

            if (driver == null)
            {
                return NotFound(
                    "Driver profile not found.");
            }

            if (!driver.IsApproved)
            {
                return BadRequest(
                    "Driver has not been approved.");
            }

            driver.IsOnline = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver is now online.",
                driverId = driver.DriverId,
                isOnline = driver.IsOnline
            });
        }

        // ============================================================
        // GO OFFLINE
        // Driver only
        // PUT: api/Driver/offline
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("offline")]
        public async Task<IActionResult> GoOffline()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId.Value);

            if (driver == null)
            {
                return NotFound(
                    "Driver profile not found.");
            }

            driver.IsOnline = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver is now offline.",
                driverId = driver.DriverId,
                isOnline = driver.IsOnline
            });
        }

        // ============================================================
        // APPROVE DRIVER
        // Admin only
        // PUT: api/Driver/{driverId}/approve
        // ============================================================

        [Authorize(Roles = "Admin")]
        [HttpPut("{driverId:int}/approve")]
        public IActionResult ApproveDriver(int driverId)
        {
            return Conflict(new
            {
                message = "Drivers must be approved through the driver partner application review process."
            });
        }
    }

}
