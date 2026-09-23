using GrabnBite.Data;
using GrabnBite.Dto.AddressDto;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext dbContext;

        public AddressesController(AppDbContext dbContext)
        {
            this.dbContext = dbContext;
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
        // GET ALL ADDRESSES
        // GET: api/Addresses
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var addresses = await dbContext.Addresses
                .AsNoTracking()
                .Where(a => a.UserId == userId.Value)
                .Select(a => new AddressResponseDto
                {
                    AddressId = a.AddressId,
                    Label = a.Label,
                    StreetAddress = a.StreetAddress,
                    City = a.City,
                    Province = a.Province,
                    PostalCode = a.PostalCode,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude,
                    IsDefault = a.IsDefault
                })
                .ToListAsync();

            return Ok(addresses);
        }

        // ============================================================
        // GET ONE ADDRESS
        // GET: api/Addresses/{id}
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAddress(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .AsNoTracking()
                .Where(a =>
                    a.AddressId == id &&
                    a.UserId == userId.Value)
                .Select(a => new AddressResponseDto
                {
                    AddressId = a.AddressId,
                    Label = a.Label,
                    StreetAddress = a.StreetAddress,
                    City = a.City,
                    Province = a.Province,
                    PostalCode = a.PostalCode,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude,
                    IsDefault = a.IsDefault
                })
                .FirstOrDefaultAsync();

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            return Ok(address);
        }

        // ============================================================
        // CREATE ADDRESS
        // POST: api/Addresses
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> CreateAddress(
            [FromBody] CreateAddressDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest("Address data is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.StreetAddress))
                return BadRequest("Street address is required.");

            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest("City is required.");

            if (string.IsNullOrWhiteSpace(dto.Province))
                return BadRequest("Province is required.");

            if (string.IsNullOrWhiteSpace(dto.PostalCode))
                return BadRequest("Postal code is required.");

            var hasExistingAddress = await dbContext.Addresses
                .AnyAsync(a => a.UserId == userId.Value);

            var address = new Address
            {
                Label = dto.Label?.Trim() ?? string.Empty,
                StreetAddress = dto.StreetAddress.Trim(),
                City = dto.City.Trim(),
                Province = dto.Province.Trim(),
                PostalCode = dto.PostalCode.Trim(),
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                UserId = userId.Value,
                IsDefault = dto.IsDefault || !hasExistingAddress
            };

            if (address.IsDefault)
            {
                var existingDefaultAddresses =
                    await dbContext.Addresses
                        .Where(a =>
                            a.UserId == userId.Value &&
                            a.IsDefault)
                        .ToListAsync();

                foreach (var existingAddress in existingDefaultAddresses)
                {
                    existingAddress.IsDefault = false;
                }
            }

            dbContext.Addresses.Add(address);

            await dbContext.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetAddress),
                new { id = address.AddressId },
                new AddressResponseDto
                {
                    AddressId = address.AddressId,
                    Label = address.Label,
                    StreetAddress = address.StreetAddress,
                    City = address.City,
                    Province = address.Province,
                    PostalCode = address.PostalCode,
                    Latitude = address.Latitude,
                    Longitude = address.Longitude,
                    IsDefault = address.IsDefault
                }
            );
        }

        // ============================================================
        // UPDATE ADDRESS
        // PUT: api/Addresses/{id}
        // ============================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAddress(
            int id,
            [FromBody] UpdateAddressDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            if (dto == null)
            {
                return BadRequest("Address data is required.");
            }

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == id &&
                    a.UserId == userId.Value);

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            if (string.IsNullOrWhiteSpace(dto.StreetAddress))
                return BadRequest("Street address is required.");

            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest("City is required.");

            if (string.IsNullOrWhiteSpace(dto.Province))
                return BadRequest("Province is required.");

            if (string.IsNullOrWhiteSpace(dto.PostalCode))
                return BadRequest("Postal code is required.");

            address.Label = dto.Label?.Trim() ?? string.Empty;
            address.StreetAddress = dto.StreetAddress.Trim();
            address.City = dto.City.Trim();
            address.Province = dto.Province.Trim();
            address.PostalCode = dto.PostalCode.Trim();
            address.Latitude = dto.Latitude;
            address.Longitude = dto.Longitude;

            await dbContext.SaveChangesAsync();

            return Ok(new AddressResponseDto
            {
                AddressId = address.AddressId,
                Label = address.Label,
                StreetAddress = address.StreetAddress,
                City = address.City,
                Province = address.Province,
                PostalCode = address.PostalCode,
                Latitude = address.Latitude,
                Longitude = address.Longitude,
                IsDefault = address.IsDefault
            });
        }

        // ============================================================
        // DELETE ADDRESS
        // DELETE: api/Addresses/{id}
        // ============================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == id &&
                    a.UserId == userId.Value);

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            dbContext.Addresses.Remove(address);

            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        // ============================================================
        // SET DEFAULT ADDRESS
        // PATCH: api/Addresses/{id}/default
        // ============================================================

        [HttpPatch("{id:int}/default")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == id &&
                    a.UserId == userId.Value);

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            var currentDefaultAddresses =
                await dbContext.Addresses
                    .Where(a =>
                        a.UserId == userId.Value &&
                        a.IsDefault)
                    .ToListAsync();

            foreach (var existingAddress in currentDefaultAddresses)
            {
                existingAddress.IsDefault = false;
            }

            address.IsDefault = true;

            await dbContext.SaveChangesAsync();

            return Ok(new
            {
                message = "Default address updated successfully."
            });
        }
    }
}