using GrabnBite.Data;
using GrabnBite.DTOs.Delivery;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Npgsql;
using System.Data;

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

        private static bool IsUniqueConstraintViolation(Exception exception)
        {
            return exception is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation }
                || exception is DbUpdateException
                {
                    InnerException: PostgresException
                    { SqlState: PostgresErrorCodes.UniqueViolation }
                };
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
                    .ThenInclude(o => o.StatusHistory)
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

            if (delivery.Order.Status != "READY_FOR_PICKUP")
            {
                return BadRequest(
                    "Only orders ready for pickup can be assigned.");
            }

            var driverHasActiveDelivery = await _context.Deliveries
                .AnyAsync(d =>
                    d.DriverId == driver.DriverId &&
                    (d.Status == "ASSIGNED"
                        || d.Status == "PICKED_UP"
                        || d.Status == "DELIVERING"));

            if (driverHasActiveDelivery)
            {
                return Conflict("This driver already has an active delivery.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Claim only if the delivery is still available. The partial unique
                // index separately prevents this driver being assigned elsewhere.
                var claimedRows = await _context.Deliveries
                    .Where(d =>
                        d.DeliveryId == deliveryId &&
                        d.Status == "UNASSIGNED" &&
                        d.DriverId == null &&
                        d.Order.Status == "READY_FOR_PICKUP")
                    .ExecuteUpdateAsync(update => update
                        .SetProperty(d => d.DriverId, driver.DriverId)
                        .SetProperty(d => d.Status, "ASSIGNED"));

                if (claimedRows == 0)
                {
                    await transaction.RollbackAsync();
                    return Conflict("This delivery is no longer available to assign.");
                }

                delivery.DriverId = driver.DriverId;
                delivery.Status = "ASSIGNED";

                // Keep the customer-facing order lifecycle aligned with delivery assignment.
                delivery.Order.Status = "ASSIGNED";
                delivery.Order.StatusHistory.Add(new OrderStatusHistory
                {
                    OrderId = delivery.OrderId,
                    Status = "ASSIGNED",
                    ChangedAt = DateTime.UtcNow,
                    ChangedByUserId = GetCurrentUserId(),
                    ChangedByRole = User.FindFirstValue(ClaimTypes.Role)
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception exception) when (IsUniqueConstraintViolation(exception))
            {
                await transaction.RollbackAsync();
                return Conflict("This driver already has an active delivery.");
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
                    (d.Status == "ASSIGNED"
                        || d.Status == "PICKED_UP"
                        || d.Status == "DELIVERING"));

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
                    name = delivery.Order.Restaurant.Name,
                    address = delivery.Order.Restaurant.Address
                },

                totalAmount = delivery.Order.TotalAmount,

                orderDate = delivery.Order.OrderDate,

                deliveryAddress = new
                {
                    AddressId = delivery.Order.DeliveryAddressId,
                    Label = delivery.Order.DeliveryAddressLabel,
                    StreetAddress = delivery.Order.DeliveryStreetAddress,
                    City = delivery.Order.DeliveryCity,
                    Province = delivery.Order.DeliveryProvince,
                    PostalCode = delivery.Order.DeliveryPostalCode,
                    Latitude = delivery.Order.DeliveryLatitude,
                    Longitude = delivery.Order.DeliveryLongitude
                },

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

        private async Task<IActionResult> TransitionDeliveryAsync(
            int deliveryId,
            int userId,
            string expectedDeliveryStatus,
            string expectedOrderStatus,
            string nextStatus,
            string successMessage,
            bool recordPickupTime = false,
            bool recordDeliveredTime = false,
            bool markDriverOnline = false)
        {
            var driver = await _context.Drivers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound("Driver profile not found.");
            }

            var delivery = await _context.Deliveries
                .AsNoTracking()
                .Where(d => d.DeliveryId == deliveryId)
                .Select(d => new
                {
                    d.DeliveryId,
                    d.OrderId,
                    d.DriverId,
                    d.Status,
                    OrderStatus = d.Order.Status
                })
                .FirstOrDefaultAsync();

            if (delivery == null)
            {
                return NotFound("Delivery not found.");
            }

            if (delivery.DriverId != driver.DriverId)
            {
                return Forbid();
            }

            if (!string.Equals(delivery.Status, expectedDeliveryStatus, StringComparison.Ordinal) ||
                !string.Equals(delivery.OrderStatus, expectedOrderStatus, StringComparison.Ordinal))
            {
                return Conflict("The delivery or order status has changed. Refresh and try again.");
            }

            var changedAt = DateTime.UtcNow;

            await using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                // Conditional updates make the state transition a single-winner claim.
                // The order update and history insert share this transaction, so a failed
                // order transition rolls the delivery update back as well.
                var changedDeliveries = await _context.Deliveries
                    .Where(d =>
                        d.DeliveryId == deliveryId &&
                        d.DriverId == driver.DriverId &&
                        d.Status == expectedDeliveryStatus &&
                        d.Order.Status == expectedOrderStatus)
                    .ExecuteUpdateAsync(update => update
                        .SetProperty(d => d.Status, nextStatus)
                        .SetProperty(d => d.PickedUpAt,
                            d => recordPickupTime ? changedAt : d.PickedUpAt)
                        .SetProperty(d => d.DeliveredAt,
                            d => recordDeliveredTime ? changedAt : d.DeliveredAt));

                if (changedDeliveries != 1)
                {
                    await transaction.RollbackAsync();
                    return Conflict("The delivery is no longer in the expected state. Refresh and try again.");
                }

                var changedOrders = await _context.Orders
                    .Where(o =>
                        o.OrderId == delivery.OrderId &&
                        o.Status == expectedOrderStatus)
                    .ExecuteUpdateAsync(update => update
                        .SetProperty(o => o.Status, nextStatus));

                if (changedOrders != 1)
                {
                    await transaction.RollbackAsync();
                    return Conflict("The order status changed while the delivery was being updated. Refresh and try again.");
                }

                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = delivery.OrderId,
                    Status = nextStatus,
                    ChangedAt = changedAt,
                    ChangedByUserId = userId,
                    ChangedByRole = "Driver"
                });

                if (markDriverOnline)
                {
                    await _context.Drivers
                        .Where(d => d.DriverId == driver.DriverId)
                        .ExecuteUpdateAsync(update => update
                            .SetProperty(d => d.IsOnline, true));
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = successMessage,
                    deliveryId = delivery.DeliveryId,
                    orderId = delivery.OrderId,
                    deliveryStatus = nextStatus,
                    orderStatus = nextStatus,
                    changedAt
                });
            }
            catch (PostgresException exception) when (
                exception.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                await transaction.RollbackAsync();
                return Conflict("Another request changed this delivery or order. Refresh and check the latest status.");
            }
        }

        // ============================================================
        // DRIVER PICKS UP ORDER
        // Driver only
        // PUT: api/Delivery/{deliveryId}/pickup
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/pickup")]
        public async Task<IActionResult> PickUpOrder(int deliveryId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            return await TransitionDeliveryAsync(
                deliveryId,
                userId.Value,
                expectedDeliveryStatus: "ASSIGNED",
                expectedOrderStatus: "ASSIGNED",
                nextStatus: "PICKED_UP",
                successMessage: "Order picked up successfully.",
                recordPickupTime: true);
        }

        // ============================================================
        // DRIVER STARTS DELIVERY
        // Driver only
        // PUT: api/Delivery/{deliveryId}/start
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/start")]
        public async Task<IActionResult> StartDelivery(int deliveryId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            return await TransitionDeliveryAsync(
                deliveryId,
                userId.Value,
                expectedDeliveryStatus: "PICKED_UP",
                expectedOrderStatus: "PICKED_UP",
                nextStatus: "DELIVERING",
                successMessage: "Delivery started.");
        }

        // ============================================================
        // DRIVER COMPLETES DELIVERY
        // Driver only
        // PUT: api/Delivery/{deliveryId}/complete
        // ============================================================

        [Authorize(Roles = "Driver")]
        [HttpPut("{deliveryId:int}/complete")]
        public async Task<IActionResult> CompleteDelivery(int deliveryId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            return await TransitionDeliveryAsync(
                deliveryId,
                userId.Value,
                expectedDeliveryStatus: "DELIVERING",
                expectedOrderStatus: "DELIVERING",
                nextStatus: "DELIVERED",
                successMessage: "Delivery completed successfully.",
                recordDeliveredTime: true,
                markDriverOnline: true);
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
                    d.DriverId == null &&
                    d.Order.Status == "READY_FOR_PICKUP")
                .OrderBy(d => d.Order.OrderDate)
                .Select(d => new
                {
                    deliveryId = d.DeliveryId,
                    orderId = d.OrderId,
                    driverId = d.DriverId,
                    status = d.Status,
                    pickedUpAt = d.PickedUpAt,
                    deliveredAt = d.DeliveredAt,
                    driverLatitude = d.DriverLatitude,
                    driverLongitude = d.DriverLongitude,
                    restaurant = new
                    {
                        restaurantId = d.Order.RestaurantId,
                        name = d.Order.Restaurant.Name,
                        address = d.Order.Restaurant.Address
                    },
                    totalAmount = d.Order.TotalAmount,
                    orderDate = d.Order.OrderDate,
                    deliveryAddress = new
                    {
                        AddressId = d.Order.DeliveryAddressId,
                        Label = d.Order.DeliveryAddressLabel,
                        StreetAddress = d.Order.DeliveryStreetAddress,
                        City = d.Order.DeliveryCity,
                        Province = d.Order.DeliveryProvince,
                        PostalCode = d.Order.DeliveryPostalCode,
                        Latitude = d.Order.DeliveryLatitude,
                        Longitude = d.Order.DeliveryLongitude
                    },

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
                return BadRequest("A valid delivery id is required.");
            }

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
                return BadRequest("You must be online to accept deliveries.");
            }

            var hasActiveDelivery = await _context.Deliveries
                .AnyAsync(d =>
                    d.DriverId == driver.DriverId &&
                    (d.Status == "ASSIGNED"
                        || d.Status == "PICKED_UP"
                        || d.Status == "DELIVERING"));

            if (hasActiveDelivery)
            {
                return Conflict("You already have an active delivery.");
            }

            var deliveryExists = await _context.Deliveries
                .AnyAsync(d => d.DeliveryId == deliveryId);

            if (!deliveryExists)
            {
                return NotFound("Delivery not found.");
            }

            // Atomically claim only a delivery that is still unassigned and ready.
            await using var transaction = await _context.Database.BeginTransactionAsync();

            int claimedRows;

            try
            {
                claimedRows = await _context.Deliveries
                    .Where(d =>
                        d.DeliveryId == deliveryId &&
                        d.Status == "UNASSIGNED" &&
                        d.DriverId == null &&
                        d.Order.Status == "READY_FOR_PICKUP")
                    .ExecuteUpdateAsync(update => update
                        .SetProperty(d => d.DriverId, driver.DriverId)
                        .SetProperty(d => d.Status, "ASSIGNED"));
            }
            catch (Exception exception) when (IsUniqueConstraintViolation(exception))
            {
                await transaction.RollbackAsync();
                return Conflict("You already have an active delivery.");
            }

            if (claimedRows == 0)
            {
                await transaction.RollbackAsync();
                return Conflict("This delivery is no longer available to accept.");
            }

            var delivery = await _context.Deliveries
                .Include(d => d.Order)
                    .ThenInclude(o => o.StatusHistory)
                .FirstAsync(d => d.DeliveryId == deliveryId);

            delivery.Order.Status = "ASSIGNED";
            delivery.Order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = delivery.OrderId,
                Status = "ASSIGNED",
                ChangedAt = DateTime.UtcNow,
            ChangedByUserId = GetCurrentUserId(),

            ChangedByRole = User.FindFirstValue(ClaimTypes.Role)
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

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
    }

}
