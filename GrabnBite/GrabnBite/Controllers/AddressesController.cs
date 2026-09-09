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
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext dbContext;

        public AddressesController(AppDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );
        }

        // GET: api/addresses
        [HttpGet]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetCurrentUserId();

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

        // GET: api/addresses/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAddress(int id)
        {
            var userId = GetCurrentUserId();

            var address = await dbContext.Addresses
                .Where(a => a.AddressId == id && a.UserId == userId)
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

        // POST: api/addresses
        [HttpPost]
        public async Task<IActionResult> CreateAddress(
            CreateAddressDto dto)
        {
            var userId = GetCurrentUserId();

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

            // If this is the first address, make it default.
            var hasExistingAddress = await dbContext.Addresses
                .AnyAsync(a => a.UserId == userId);

            if (!hasExistingAddress)
            {
                address.IsDefault = true;
            }

            // If this address is being made default,
            // remove default status from existing addresses.
            if (address.IsDefault)
            {
                var existingDefaultAddresses = await dbContext.Addresses
                    .Where(a => a.UserId == userId && a.IsDefault)
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

        // PUT: api/addresses/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAddress(
            int id,
            UpdateAddressDto dto)
        {
            var userId = GetCurrentUserId();

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(
                    a => a.AddressId == id && a.UserId == userId
                );

            if (address == null)
            {
                return NotFound("Address not found.");
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

        // DELETE: api/addresses/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetCurrentUserId();

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(
                    a => a.AddressId == id && a.UserId == userId
                );

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            dbContext.Addresses.Remove(address);

            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/addresses/{id}/default
        [HttpPatch("{id:int}/default")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            var userId = GetCurrentUserId();

            var address = await dbContext.Addresses
                .FirstOrDefaultAsync(
                    a => a.AddressId == id && a.UserId == userId
                );

            if (address == null)
            {
                return NotFound("Address not found.");
            }

            var currentDefaultAddresses = await dbContext.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
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