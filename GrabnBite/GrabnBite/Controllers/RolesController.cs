using GrabnBite.Data;
using GrabnBite.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ROLES
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .OrderBy(r => r.RoleId)
                .Select(r => new
                {
                    r.RoleId,
                    r.Name,
                    r.Description
                })
                .ToListAsync();

            return Ok(roles);
        }

        // =========================================================
        // GET ONE ROLE
        // =========================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRole(int id)
        {
            if (id <= 0)
            {
                return BadRequest("A valid role ID is required.");
            }

            var role = await _context.Roles
                .AsNoTracking()
                .Where(r => r.RoleId == id)
                .Select(r => new
                {
                    r.RoleId,
                    r.Name,
                    r.Description
                })
                .FirstOrDefaultAsync();

            if (role == null)
            {
                return NotFound("Role not found.");
            }

            return Ok(role);
        }

        // =========================================================
        // CREATE ROLE
        // =========================================================
        [HttpPost]
        public async Task<IActionResult> CreateRole(
            [FromBody] Role role)
        {
            if (role == null)
            {
                return BadRequest("Role data is required.");
            }

            if (string.IsNullOrWhiteSpace(role.Name))
            {
                return BadRequest("Role name is required.");
            }

            var roleName = role.Name.Trim();

            var exists = await _context.Roles
                .AnyAsync(r => r.Name.ToLower() == roleName.ToLower());

            if (exists)
            {
                return Conflict("A role with this name already exists.");
            }

            var newRole = new Role
            {
                Name = roleName,
                Description = string.IsNullOrWhiteSpace(role.Description)
                    ? null
                    : role.Description.Trim()
            };

            _context.Roles.Add(newRole);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRole),
                new { id = newRole.RoleId },
                new
                {
                    newRole.RoleId,
                    newRole.Name,
                    newRole.Description
                });
        }

        // =========================================================
        // UPDATE ROLE
        // =========================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(
            int id,
            [FromBody] Role role)
        {
            if (id <= 0)
            {
                return BadRequest("A valid role ID is required.");
            }

            if (role == null)
            {
                return BadRequest("Role data is required.");
            }

            if (string.IsNullOrWhiteSpace(role.Name))
            {
                return BadRequest("Role name is required.");
            }

            var existingRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (existingRole == null)
            {
                return NotFound("Role not found.");
            }

            var roleName = role.Name.Trim();

            var duplicate = await _context.Roles
                .AnyAsync(r =>
                    r.RoleId != id &&
                    r.Name.ToLower() == roleName.ToLower());

            if (duplicate)
            {
                return Conflict("Another role already has this name.");
            }

            existingRole.Name = roleName;
            existingRole.Description =
                string.IsNullOrWhiteSpace(role.Description)
                    ? null
                    : role.Description.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                existingRole.RoleId,
                existingRole.Name,
                existingRole.Description
            });
        }

        // =========================================================
        // DELETE ROLE
        // =========================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            if (id <= 0)
            {
                return BadRequest("A valid role ID is required.");
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound("Role not found.");
            }

            var usersUsingRole = await _context.Users
                .AnyAsync(u => u.RoleId == id);

            if (usersUsingRole)
            {
                return Conflict(
                    "This role cannot be deleted because users are assigned to it.");
            }

            _context.Roles.Remove(role);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role deleted successfully."
            });
        }
    }
}