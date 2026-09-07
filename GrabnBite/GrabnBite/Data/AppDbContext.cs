using Microsoft.EntityFrameworkCore;
using GrabnBite.Models;
using GrabnBite.Models.Entities;

namespace GrabnBite.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
                
        }

        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<MenuCategory> Menus { get; set; }
        public DbSet<User> Users { get; set; }



    }
}
