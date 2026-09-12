using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using GrabnBite.Models.Entities;

namespace GrabnBite.Data
{
    public static class DbSeeder
    {
        public static void Seed(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var context = services.GetRequiredService<AppDbContext>();

            // Apply pending migrations (safe for dev/test)
            context.Database.Migrate();

            // --- Users ---
            var customer = context.Users.FirstOrDefault(u => u.Email == "customer@example.com");
            if (customer == null)
            {
                customer = new User
                {
                    FirstName = "Test",
                    LastName = "Customer",
                    Email = "customer@example.com",
                    PhoneNumber = "+27123456789",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Role = "Customer",
                    IsActive = true
                };

                context.Users.Add(customer);
            }

            var restOwner = context.Users.FirstOrDefault(u => u.Email == "owner@burgerhouse.local");
            if (restOwner == null)
            {
                restOwner = new User
                {
                    FirstName = "Owner",
                    LastName = "Restaurant",
                    Email = "owner@burgerhouse.local",
                    PhoneNumber = "+27109876543",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("OwnerPassword123!"),
                    Role = "Restaurant",
                    IsActive = true
                };

                context.Users.Add(restOwner);
            }

            context.SaveChanges();

            // --- Address for customer ---
            if (!context.Addresses.Any(a => a.UserId == customer.UserId && a.Label == "Home"))
            {
                var address = new Address
                {
                    Label = "Home",
                    StreetAddress = "123 Example Street",
                    City = "Cape Town",
                    Province = "Western Cape",
                    PostalCode = "8000",
                    Latitude = -33.9249,
                    Longitude = 18.4241,
                    IsDefault = true,
                    UserId = customer.UserId
                };

                context.Addresses.Add(address);
                context.SaveChanges();
            }

            // --- Restaurant ---
            var restaurant = context.Restaurants.FirstOrDefault(r => r.Email == "orders@burger.local");
            if (restaurant == null)
            {
                restaurant = new Restaurant
                {
                    Name = "Burger House",
                    Description = "Test burgers and fries",
                    PhoneNumber = "+27112223333",
                    Email = "orders@burger.local",
                    Address = "5 Food St",
                    Latitude = 0m,
                    Longitude = 0m,
                    IsOpen = true,
                    IsApproved = true,
                    UserId = restOwner.UserId
                };

                context.Restaurants.Add(restaurant);
                context.SaveChanges();
            }

            // --- Menu Category ---
            var burgersCategory = context.MenuCategories.FirstOrDefault(mc =>
                mc.RestaurantId == restaurant.RestaurantId && mc.Name == "Burgers");
            if (burgersCategory == null)
            {
                burgersCategory = new MenuCategory
                {
                    Name = "Burgers",
                    Description = "Beef and vegetarian burgers",
                    RestaurantId = restaurant.RestaurantId
                };

                context.MenuCategories.Add(burgersCategory);
                context.SaveChanges();
            }

            // --- Menu Items ---
            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant.RestaurantId && mi.Name == "Classic Beef Burger"))
            {
                var item1 = new MenuItem
                {
                    Name = "Classic Beef Burger",
                    Description = "Beef patty, lettuce, tomato, special sauce",
                    Price = 59.99m,
                    IsAvailable = true,
                    RestaurantId = restaurant.RestaurantId,
                    MenuCategoryId = burgersCategory.MenuCategoryId
                };

                context.MenuItems.Add(item1);
            }

            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant.RestaurantId && mi.Name == "Veggie Burger"))
            {
                var item2 = new MenuItem
                {
                    Name = "Veggie Burger",
                    Description = "Plant-based patty, lettuce, tomato",
                    Price = 49.50m,
                    IsAvailable = true,
                    RestaurantId = restaurant.RestaurantId,
                    MenuCategoryId = burgersCategory.MenuCategoryId
                };

                context.MenuItems.Add(item2);
            }

            context.SaveChanges();
        }
    }
}