using GrabnBite.Data;
using GrabnBite.DTOs.Delivery;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeliveryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DeliveryController(AppDbContext context)
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
        // CREATE DELIVERY
        // Admin creates delivery for ready order
        // ============================================================

        [HttpPost("{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateDelivery(
            int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Delivery)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (order.Status != "READY_FOR_PICKUP")
            {
                return BadRequest(
                    "Delivery can only be created when the order is ready for pickup.");
            }

            if (order.Delivery != null)
            {
                return BadRequest(
                    "A delivery already exists for this order.");
            }

            var delivery = new Delivery
            {
                OrderId = order.OrderId,
                DriverId = null,
                Status = "UNASSIGNED"
            };

            _context.Deliveries.Add(delivery);

            await _context.SaveChangesAsync();

            return Ok(new DeliveryResponseDto
            {
                DeliveryId = delivery.DeliveryId,
                OrderId = delivery.OrderId,
                DriverId = delivery.DriverId,
                Status = delivery.Status,
                PickedUpAt = delivery.PickedUpAt,
                DeliveredAt = delivery.DeliveredAt,
                DriverLatitude = delivery.DriverLatitude,
                DriverLongitude = delivery.DriverLongitude
            });
        }

        // ============================================================
        // ASSIGN DRIVER
        // Admin assigns driver
        // ============================================================

        [HttpPut("{deliveryId}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignDriver(
            int deliveryId,
            AssignDriverDto dto)
        {
            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.Status != "UNASSIGNED")
            {
                return BadRequest(
                    "This delivery has already been assigned.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == dto.DriverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
            }

            if (!driver.IsApproved)
            {
                return BadRequest(
                    "Driver has not been approved.");
            }

            if (!driver.IsOnline)
            {
                return BadRequest(
                    "Driver is currently offline.");
            }

            delivery.DriverId = driver.DriverId;
            delivery.Status = "ASSIGNED";

            await _context.SaveChangesAsync();

            return Ok(new DeliveryResponseDto
            {
                DeliveryId = delivery.DeliveryId,
                OrderId = delivery.OrderId,
                DriverId = delivery.DriverId,
                Status = delivery.Status,
                PickedUpAt = delivery.PickedUpAt,
                DeliveredAt = delivery.DeliveredAt,
                DriverLatitude =
                    delivery.DriverLatitude,
                DriverLongitude =
                    delivery.DriverLongitude
            });
        }

        // ============================================================
        // GET MY DELIVERY
        // ============================================================

        [HttpGet("my-delivery")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> GetMyDelivery()
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driver.DriverId &&
                    d.Status != "DELIVERED");

            if (delivery == null)
            {
                return NotFound(
                    "No active delivery assigned.");
            }

            return Ok(new DeliveryResponseDto
            {
                DeliveryId = delivery.DeliveryId,
                OrderId = delivery.OrderId,
                DriverId = delivery.DriverId,
                Status = delivery.Status,
                PickedUpAt = delivery.PickedUpAt,
                DeliveredAt = delivery.DeliveredAt,
                DriverLatitude =
                    delivery.DriverLatitude,
                DriverLongitude =
                    delivery.DriverLongitude
            });
        }

        // ============================================================
        // DRIVER PICKS UP ORDER
        // ============================================================

        [HttpPut("{deliveryId}/pickup")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> PickUpOrder(
            int deliveryId)
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.DriverId != driver.DriverId)
            {
                return Forbid();
            }

            if (delivery.Status != "ASSIGNED")
            {
                return BadRequest(
                    "Only assigned deliveries can be picked up.");
            }

            delivery.Status = "PICKED_UP";
            delivery.PickedUpAt = DateTime.UtcNow;

            delivery.Order.Status = "DRIVER_PICKED_UP";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order picked up successfully.",
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                deliveryStatus = delivery.Status,
                orderStatus = delivery.Order.Status
            });
        }

        // ============================================================
        // DRIVER STARTS DELIVERY
        // ============================================================

        [HttpPut("{deliveryId}/start")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> StartDelivery(
            int deliveryId)
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.DriverId != driver.DriverId)
            {
                return Forbid();
            }

            if (delivery.Status != "PICKED_UP")
            {
                return BadRequest(
                    "The order must be picked up first.");
            }

            delivery.Status = "DELIVERING";

            delivery.Order.Status = "DELIVERING";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Delivery started.",
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                deliveryStatus = delivery.Status,
                orderStatus = delivery.Order.Status
            });
        }

        // ============================================================
        // DRIVER COMPLETES DELIVERY
        // ============================================================

        [HttpPut("{deliveryId}/complete")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> CompleteDelivery(
            int deliveryId)
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.DriverId != driver.DriverId)
            {
                return Forbid();
            }

            if (delivery.Status != "DELIVERING")
            {
                return BadRequest(
                    "Only active deliveries can be completed.");
            }

            delivery.Status = "DELIVERED";
            delivery.DeliveredAt = DateTime.UtcNow;

            delivery.Order.Status = "DELIVERED";

            // Driver becomes available again
            driver.IsOnline = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Delivery completed successfully.",
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                deliveryStatus = delivery.Status,
                orderStatus = delivery.Order.Status,
                deliveredAt = delivery.DeliveredAt
            });
        }

        // ============================================================
        // UPDATE DRIVER LOCATION
        // Location is now stored directly in SQL Server
        // ============================================================

        [HttpPut("{deliveryId}/location")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> UpdateDriverLocation(
            int deliveryId,
            UpdateDriverLocationDto dto)
        {
            var userId = GetCurrentUserId();

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.DriverId != driver.DriverId)
            {
                return Forbid();
            }

            if (delivery.Status != "DELIVERING")
            {
                return BadRequest(
                    "Driver location can only be updated during an active delivery.");
            }

            if (dto.Latitude < -90 ||
                dto.Latitude > 90)
            {
                return BadRequest(
                    "Invalid latitude.");
            }

            if (dto.Longitude < -180 ||
                dto.Longitude > 180)
            {
                return BadRequest(
                    "Invalid longitude.");
            }

            // ------------------------------------------------------------
            // Save latest location directly to the database
            // ------------------------------------------------------------

            delivery.DriverLatitude = dto.Latitude;
            delivery.DriverLongitude = dto.Longitude;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver location updated successfully.",
                deliveryId,
                orderId = delivery.OrderId,
                latitude = dto.Latitude,
                longitude = dto.Longitude
            });
        }

        // ============================================================
        // GET DRIVER LOCATION
        // Location is retrieved directly from SQL Server
        // ============================================================

        [HttpGet("{deliveryId}/location")]
        [Authorize]
        public async Task<IActionResult> GetDriverLocation(
            int deliveryId)
        {
            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId);

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            var userId = GetCurrentUserId();

            if (User.IsInRole("Customer"))
            {
                if (delivery.Order.UserId != userId)
                {
                    return Forbid();
                }
            }

            if (User.IsInRole("Driver"))
            {
                var driver = await _context.Drivers
                    .FirstOrDefaultAsync(d =>
                        d.UserId == userId);

                if (driver == null ||
                    delivery.DriverId != driver.DriverId)
                {
                    return Forbid();
                }
            }

            if (User.IsInRole("Restaurant"))
            {
                var restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r =>
                        r.RestaurantId ==
                        delivery.Order.RestaurantId &&
                        r.UserId == userId);

                if (restaurant == null)
                {
                    return Forbid();
                }
            }

            // ------------------------------------------------------------
            // Return the latest location stored in the database
            // ------------------------------------------------------------

            if (delivery.DriverLatitude == null ||
                delivery.DriverLongitude == null)
            {
                return NotFound(
                    "No current driver location is available.");
            }

            return Ok(new
            {
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                driverId = delivery.DriverId,
                latitude = delivery.DriverLatitude,
                longitude = delivery.DriverLongitude
            });
        }
    }
}