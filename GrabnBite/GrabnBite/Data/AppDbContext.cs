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
        public DbSet<Order> Orders { get; set; }
        public DbSet<MenuCategory> MenuCategories { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<User> Users { get; set; }



    }
}
