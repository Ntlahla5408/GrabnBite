using GrabnBite.Data;
using GrabnBite.Dto.AddressDto;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext dbContext;

        public AddressesController(AppDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        // ============================================================
        // GET ALL ADDRESSES
        // GET: api/Addresses/{userId}
        // ============================================================

        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetAddresses(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            var addresses = await dbContext.Addresses
                .Where(a => a.UserId == userId)
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
        // GET: api/Addresses/{userId}/{id}
        // ============================================================

        [HttpGet("{userId:int}/{id:int}")]
        public async Task<IActionResult> GetAddress(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .Where(a =>
                    a.AddressId == id &&
                    a.UserId == userId)
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
        // POST: api/Addresses/{userId}
        // ============================================================

        [HttpPost("{userId:int}")]
        public async Task<IActionResult> CreateAddress(
            int userId,
            CreateAddressDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (dto == null)
            {
                return BadRequest("Address data is required.");
            }

            // --------------------------------------------------------
            // Basic validation
            // --------------------------------------------------------

            if (string.IsNullOrWhiteSpace(dto.StreetAddress))
            {
                return BadRequest("Street address is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.City))
            {
                return BadRequest("City is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Province))
            {
                return BadRequest("Province is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.PostalCode))
            {
                return BadRequest("Postal code is required.");
            }

            var address = new Address
            {
                Label = dto.Label,
                StreetAddress = dto.StreetAddress,
                City = dto.City,
                Province = dto.Province,
                PostalCode = dto.PostalCode,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                UserId = userId,
                IsDefault = dto.IsDefault
            };

            // --------------------------------------------------------
            // If this is the first address, make it default.
            // --------------------------------------------------------

            var hasExistingAddress = await dbContext.Addresses
                .AnyAsync(a => a.UserId == userId);

            if (!hasExistingAddress)
            {
                address.IsDefault = true;
            }

            // --------------------------------------------------------
            // If this address is default, remove default from
            // existing addresses.
            // --------------------------------------------------------

            if (address.IsDefault)
            {
                var existingDefaultAddresses =
                    await dbContext.Addresses
                        .Where(a =>
                            a.UserId == userId &&
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
                new
                {
                    userId = userId,
                    id = address.AddressId
                },
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
        // PUT: api/Addresses/{userId}/{id}
        // ============================================================

        [HttpPut("{userId:int}/{id:int}")]
        public async Task<IActionResult> UpdateAddress(
            int userId,
            int id,
            UpdateAddressDto dto)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
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
                    a.UserId == userId);

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            // --------------------------------------------------------
            // Validation
            // --------------------------------------------------------

            if (string.IsNullOrWhiteSpace(dto.StreetAddress))
            {
                return BadRequest("Street address is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.City))
            {
                return BadRequest("City is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Province))
            {
                return BadRequest("Province is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.PostalCode))
            {
                return BadRequest("Postal code is required.");
            }

            address.Label = dto.Label;
            address.StreetAddress = dto.StreetAddress;
            address.City = dto.City;
            address.Province = dto.Province;
            address.PostalCode = dto.PostalCode;
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
        // DELETE: api/Addresses/{userId}/{id}
        // ============================================================

        [HttpDelete("{userId:int}/{id:int}")]
        public async Task<IActionResult> DeleteAddress(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == id &&
                    a.UserId == userId);

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
        // PATCH: api/Addresses/{userId}/{id}/default
        // ============================================================

        [HttpPatch("{userId:int}/{id:int}/default")]
        public async Task<IActionResult> SetDefaultAddress(
            int userId,
            int id)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (id <= 0)
            {
                return BadRequest("Invalid address ID.");
            }

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(a =>
                    a.AddressId == id &&
                    a.UserId == userId);

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            var currentDefaultAddresses =
                await dbContext.Addresses
                    .Where(a =>
                        a.UserId == userId &&
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