using GrabnBite.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<User> Users { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<MenuCategory> MenuCategories { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

        public DbSet<Payment> Payments { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Driver> Drivers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)

        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // USER → ADDRESS
            // =========================

            modelBuilder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // USER → ORDER
            // =========================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // USER → REVIEW
            // =========================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // USER → NOTIFICATION
            // =========================

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // USER → DRIVER
            // One User can have zero or one Driver
            // =========================

            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.Driver)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // RESTAURANT → MENU CATEGORY
            // =========================

            modelBuilder.Entity<MenuCategory>()
                .HasOne(mc => mc.Restaurant)
                .WithMany(r => r.MenuCategories)
                .HasForeignKey(mc => mc.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // RESTAURANT → MENU ITEM
            // =========================

            modelBuilder.Entity<MenuItem>()
                .HasOne(mi => mi.Restaurant)
                .WithMany(r => r.MenuItems)
                .HasForeignKey(mi => mi.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // MENU CATEGORY → MENU ITEM
            // =========================

            modelBuilder.Entity<MenuItem>()
                .HasOne(mi => mi.MenuCategory)
                .WithMany(mc => mc.MenuItems)
                .HasForeignKey(mi => mi.MenuCategoryId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // RESTAURANT → ORDER
            // =========================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Restaurant)
                .WithMany(r => r.Orders)
                .HasForeignKey(o => o.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // ADDRESS → ORDER
            // =========================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.DeliveryAddress)
                .WithMany(a => a.Orders)
                .HasForeignKey(o => o.DeliveryAddressId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // ORDER → ORDER ITEM
            // =========================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // MENU ITEM → ORDER ITEM
            // =========================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.MenuItem)
                .WithMany(mi => mi.OrderItems)
                .HasForeignKey(oi => oi.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // ORDER → PAYMENT
            // One Order has zero or one Payment
            // =========================

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithOne(o => o.Payment)
                .HasForeignKey<Payment>(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // ORDER → DELIVERY
            // One Order has zero or one Delivery
            // =========================

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Order)
                .WithOne(o => o.Delivery)
                .HasForeignKey<Delivery>(d => d.OrderId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // DRIVER → DELIVERY
            // =========================

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Driver)
                .WithMany(dr => dr.Deliveries)
                .HasForeignKey(d => d.DriverId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // RESTAURANT → REVIEW
            // =========================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Restaurant)
                .WithMany(rest => rest.Reviews)
                .HasForeignKey(r => r.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // ORDER → REVIEW
            // One Order can have zero or one Review
            // =========================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Order)
                .WithOne(o => o.Review)
                .HasForeignKey<Review>(r => r.OrderId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // DECIMAL PRECISION
            // =========================

            modelBuilder.Entity<MenuItem>()
                .Property(mi => mi.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.Subtotal)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(10, 2);


            // =========================
            // USER EMAIL
            // =========================

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // =========================
            // RESTURANT → USER
            // Changed to one-to-many: a User can own many Restaurants
            // =========================
            modelBuilder.Entity<Restaurant>()
                .HasOne(r => r.User)
                .WithMany(u => u.Restaurants)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cart>()
    .HasOne(c => c.User)
    .WithMany()
    .HasForeignKey(c => c.UserId)
    .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cart>()
    .HasOne(c => c.Restaurant)
    .WithMany()
    .HasForeignKey(c => c.RestaurantId)
    .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartItem>()
    .HasOne(ci => ci.Cart)
    .WithMany(c => c.CartItems)
    .HasForeignKey(ci => ci.CartId)
    .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
    .HasOne(ci => ci.MenuItem)
    .WithMany()
    .HasForeignKey(ci => ci.MenuItemId)
    .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartItem>()
    .Property(ci => ci.UnitPrice)
    .HasPrecision(10, 2);

            modelBuilder.Entity<Cart>()
    .HasIndex(c => new { c.UserId, c.RestaurantId })
    .IsUnique();

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.Subtotal)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderStatusHistory>()
    .HasOne(h => h.Order)
    .WithMany(o => o.StatusHistory)
    .HasForeignKey(h => h.OrderId)
    .OnDelete(DeleteBehavior.Cascade);
        }
    }
}