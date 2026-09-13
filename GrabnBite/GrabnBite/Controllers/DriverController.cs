using GrabnBite.Data;
using GrabnBite.DTOs.Driver;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        // ============================================================
        // REGISTER DRIVER PROFILE
        // ============================================================

        [HttpPost("{userId}")]
        public async Task<IActionResult> CreateDriver(
            int userId,
            CreateDriverDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

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
                VehicleType = dto.VehicleType.Trim(),
                VehicleRegistration = dto.VehicleRegistration.Trim(),
                IsOnline = false,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Drivers.Add(driver);

            await _context.SaveChangesAsync();

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

        // ============================================================
        // GET DRIVER PROFILE
        // ============================================================

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetDriverByUser(
            int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("A valid userId is required.");
            }

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
                VehicleRegistration = driver.VehicleRegistration,
                IsOnline = driver.IsOnline,
                IsApproved = driver.IsApproved,
                CreatedAt = driver.CreatedAt
            });
        }

        // ============================================================
        // GO ONLINE
        // ============================================================

        [HttpPut("{driverId}/online")]
        public async Task<IActionResult> GoOnline(
            int driverId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == driverId);

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
        // ============================================================

        [HttpPut("{driverId}/offline")]
        public async Task<IActionResult> GoOffline(
            int driverId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == driverId);

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
        // ============================================================

        [HttpPut("{driverId}/approve")]
        public async Task<IActionResult> ApproveDriver(
            int driverId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

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