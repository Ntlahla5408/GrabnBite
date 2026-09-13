using GrabnBite.Data;
using GrabnBite.DTOs.Delivery;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DeliveryController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // CREATE DELIVERY
        // Admin creates delivery for ready order
        // ============================================================

        [HttpPost("{orderId}")]
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
                DriverLatitude = delivery.DriverLatitude,
                DriverLongitude = delivery.DriverLongitude
            });
        }

        // ============================================================
        // GET MY DELIVERY
        // driverId is supplied explicitly
        // ============================================================

        [HttpGet("driver/{driverId}/my-delivery")]
        public async Task<IActionResult> GetMyDelivery(
            int driverId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
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
                DriverLatitude = delivery.DriverLatitude,
                DriverLongitude = delivery.DriverLongitude
            });
        }

        // ============================================================
        // DRIVER PICKS UP ORDER
        // ============================================================

        [HttpPut("{driverId}/{deliveryId}/pickup")]
        public async Task<IActionResult> PickUpOrder(
            int driverId,
            int deliveryId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
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

        [HttpPut("{driverId}/{deliveryId}/start")]
        public async Task<IActionResult> StartDelivery(
            int driverId,
            int deliveryId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
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

        [HttpPut("{driverId}/{deliveryId}/complete")]
        public async Task<IActionResult> CompleteDelivery(
            int driverId,
            int deliveryId)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
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
        // ============================================================

        [HttpPut("{driverId}/{deliveryId}/location")]
        public async Task<IActionResult> UpdateDriverLocation(
            int driverId,
            int deliveryId,
            UpdateDriverLocationDto dto)
        {
            if (driverId <= 0)
            {
                return BadRequest("A valid driverId is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound("Driver not found.");
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
        // ============================================================

        [HttpGet("{deliveryId}/location")]
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