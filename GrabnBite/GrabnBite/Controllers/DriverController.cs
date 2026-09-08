using System.Security.Claims;
using GrabnBite.Data;
using GrabnBite.DTOs.Driver;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DriverController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DriverController(AppDbContext context)
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
        // REGISTER DRIVER PROFILE
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> CreateDriver(
            CreateDriverDto dto)
        {
            var userId = GetCurrentUserId();

            var existingDriver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (existingDriver != null)
            {
                return BadRequest(
                    "A driver profile already exists for this user.");
            }

            if (string.IsNullOrWhiteSpace(dto.VehicleType))
            {
                return BadRequest("Vehicle type is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.VehicleRegistration))
            {
                return BadRequest(
                    "Vehicle registration is required.");
            }

            var driver = new Driver
            {
                UserId = userId,
                VehicleType = dto.VehicleType,
                VehicleRegistration = dto.VehicleRegistration,
                IsOnline = false,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Drivers.Add(driver);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMyDriver),
                null,
                new DriverResponseDto
                {
                    DriverId = driver.DriverId,
                    UserId = driver.UserId,
                    VehicleType = driver.VehicleType,
                    VehicleRegistration =
                        driver.VehicleRegistration,
                    IsOnline = driver.IsOnline,
                    IsApproved = driver.IsApproved,
                    CreatedAt = driver.CreatedAt
                });
        }

        // ============================================================
        // GET MY DRIVER PROFILE
        // ============================================================

        [HttpGet("me")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> GetMyDriver()
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

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
                VehicleRegistration =
                    driver.VehicleRegistration,
                IsOnline = driver.IsOnline,
                IsApproved = driver.IsApproved,
                CreatedAt = driver.CreatedAt
            });
        }

        // ============================================================
        // GO ONLINE
        // ============================================================

        [HttpPut("online")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> GoOnline()
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

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
                isOnline = driver.IsOnline
            });
        }

        // ============================================================
        // GO OFFLINE
        // ============================================================

        [HttpPut("offline")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> GoOffline()
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

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
                isOnline = driver.IsOnline
            });
        }

        [HttpPut("{driverId}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveDriver(int driverId)
        {
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
            }

            driver.IsApproved = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver approved successfully.",
                driverId = driver.DriverId,
                isApproved = driver.IsApproved
            });
        }
    }
}