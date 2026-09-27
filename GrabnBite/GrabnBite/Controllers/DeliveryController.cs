using GrabnBite.Data;
using GrabnBite.DTOs.Delivery;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
        // CREATE DELIVERY
        // Admin only
        // POST: api/Delivery/{orderId}
        // ============================================================

        [Authorize(Roles = "Admin")]
        [HttpPost("{orderId:int}")]
        public async Task<IActionResult> CreateDelivery(int orderId)
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
        // Admin only
        // PUT: api/Delivery/{deliveryId}/assign
        // ============================================================

        [Authorize(Roles = "Admin")]
        [HttpPut("{deliveryId:int}/assign")]
        public async Task<IActionResult> AssignDriver(
            int deliveryId,
            [FromBody] AssignDriverDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Driver assignment data is required.");
            }

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
        // Driver only
        // GET: api/Delivery/my-delivery
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpGet("my-delivery")]
        public async Task<IActionResult> GetMyDelivery()
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
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .AsNoTracking()
                .Include(d => d.Order)
                    .ThenInclude(o => o.Restaurant)
                .Include(d => d.Order)
                    .ThenInclude(o => o.DeliveryAddress)
                .Include(d => d.Order)
                    .ThenInclude(o => o.OrderItems)
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driver.DriverId &&
                    d.Status != "DELIVERED");

            if (delivery == null)
            {
                return NotFound(
                    "No active delivery assigned.");
            }

            return Ok(new
            {
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                driverId = delivery.DriverId,

                status = delivery.Status,

                pickedUpAt = delivery.PickedUpAt,
                deliveredAt = delivery.DeliveredAt,

                driverLatitude = delivery.DriverLatitude,
                driverLongitude = delivery.DriverLongitude,

                restaurant = new
                {
                    restaurantId = delivery.Order.RestaurantId,
                    name = delivery.Order.Restaurant.Name
                },

                totalAmount = delivery.Order.TotalAmount,

                orderDate = delivery.Order.OrderDate,

                deliveryAddress = delivery.Order.DeliveryAddress,

                items = delivery.Order.OrderItems.Select(item => new
                {
                    orderItemId = item.OrderItemId,
                    menuItemId = item.MenuItemId,
                    menuItemName = item.ItemName,
                    quantity = item.Quantity,
                    unitPrice = item.UnitPrice,
                    subtotal = item.Subtotal
                })
            });
        }

        // ============================================================
        // DRIVER PICKS UP ORDER
        // Driver only
        // PUT: api/Delivery/{deliveryId}/pickup
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/pickup")]
        public async Task<IActionResult> PickUpOrder(
            int deliveryId)
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
        // Driver only
        // PUT: api/Delivery/{deliveryId}/start
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/start")]
        public async Task<IActionResult> StartDelivery(
            int deliveryId)
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
        // Driver only
        // PUT: api/Delivery/{deliveryId}/complete
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/complete")]
        public async Task<IActionResult> CompleteDelivery(
            int deliveryId)
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
        // Driver only
        // PUT: api/Delivery/{deliveryId}/location
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/location")]
        public async Task<IActionResult> UpdateDriverLocation(
            int deliveryId,
            [FromBody] UpdateDriverLocationDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest("Location data is required.");
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId.Value);

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
                return BadRequest("Invalid latitude.");
            }

            if (dto.Longitude < -180 ||
                dto.Longitude > 180)
            {
                return BadRequest("Invalid longitude.");
            }

            delivery.DriverLatitude = dto.Latitude;
            delivery.DriverLongitude = dto.Longitude;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver location updated successfully.",
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                latitude = dto.Latitude,
                longitude = dto.Longitude
            });
        }

        // ============================================================
        // GET DRIVER LOCATION
        // Customer only
        // GET: api/Delivery/{deliveryId}/location
        // ============================================================

        [Authorize(Roles = "Customer")]
        [HttpGet("{deliveryId:int}/location")]
        public async Task<IActionResult> GetDriverLocation(
            int deliveryId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                .FirstOrDefaultAsync(d =>
                    d.DeliveryId == deliveryId &&
                    d.Order.UserId == userId.Value);

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

        // ============================================================
        // GET AVAILABLE DELIVERIES
        // ============================================================

        [HttpGet("available")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> GetAvailableDeliveries()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId.Value);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            if (!driver.IsApproved)
            {
                return Forbid();
            }

            if (!driver.IsOnline)
            {
                return BadRequest(
                    "You must be online to view available deliveries.");
            }

            var deliveries = await _context.Deliveries
                .AsNoTracking()
                .Include(d => d.Order)
                    .ThenInclude(o => o.Restaurant)
                .Include(d => d.Order)
                    .ThenInclude(o => o.DeliveryAddress)
                .Include(d => d.Order)
                    .ThenInclude(o => o.OrderItems)
                .Where(d =>
                    d.Status == "UNASSIGNED" &&
                    d.DriverId == null)
                .OrderBy(d => d.Order.OrderDate)
                .Select(d => new
                {
                    deliveryId = d.DeliveryId,
                    orderId = d.OrderId,
                    status = d.Status,

                    restaurantId = d.Order.RestaurantId,
                    restaurantName = d.Order.Restaurant.Name,

                    totalAmount = d.Order.TotalAmount,
                    orderDate = d.Order.OrderDate,

                    deliveryAddressId = d.Order.DeliveryAddressId,

                    deliveryAddress = d.Order.DeliveryAddress,

                    items = d.Order.OrderItems.Select(item => new
                    {
                        orderItemId = item.OrderItemId,
                        menuItemId = item.MenuItemId,
                        menuItemName = item.ItemName,
                        quantity = item.Quantity,
                        unitPrice = item.UnitPrice,
                        subtotal = item.Subtotal
                    })
                })
                .ToListAsync();

            return Ok(deliveries);
        }

        // ============================================================
        // ACCEPT DELIVERY
        // ============================================================

        [HttpPut("{deliveryId}/accept")]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> AcceptDelivery(int deliveryId)
        {
            if (deliveryId <= 0)
            {
                return BadRequest(
                    "A valid delivery id is required.");
            }

            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var parsedUserId))
            {
                return Unauthorized();
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == parsedUserId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            if (!driver.IsApproved)
            {
                return BadRequest(
                    "Your driver account has not been approved.");
            }

            if (!driver.IsOnline)
            {
                return BadRequest(
                    "You must be online to accept deliveries.");
            }

            // Check whether driver already has an active delivery
            var existingDelivery = await _context.Deliveries
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driver.DriverId &&
                    d.Status != "DELIVERED");

            if (existingDelivery != null)
            {
                return BadRequest(
                    "You already have an active delivery.");
            }

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
                    "This delivery has already been accepted.");
            }

            if (delivery.DriverId != null)
            {
                return BadRequest(
                    "This delivery has already been assigned.");
            }

            // Assign delivery to current driver
            delivery.DriverId = driver.DriverId;
            delivery.Status = "ASSIGNED";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Delivery accepted successfully.",
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                driverId = driver.DriverId,
                status = delivery.Status
            });
        }
    }

}
