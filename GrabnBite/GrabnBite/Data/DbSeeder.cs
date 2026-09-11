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

            // Idempotent: if we have any users, assume seeded
            if (context.Users.Any())
                return;

            // --- Users ---
            var customer = new User
            {
                FirstName = "Test",
                LastName = "Customer",
                Email = "customer@example.com",
                PhoneNumber = "+27123456789",
                PasswordHash = "password-hash-placeholder",
                Role = "Customer",
                IsActive = true
            };

            var restOwner = new User
            {
                FirstName = "Owner",
                LastName = "Restaurant",
                Email = "owner@burgerhouse.local",
                PhoneNumber = "+27109876543",
                PasswordHash = "owner-hash-placeholder",
                Role = "Restaurant",
                IsActive = true
            };

            context.Users.AddRange(customer, restOwner);
            context.SaveChanges();

            // --- Address for customer ---
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

            // --- Restaurant ---
            var restaurant = new Restaurant
            {
                Name = "Burger House",
                Description = "Test burgers and fries",
                PhoneNumber = "+27112223333",
                Email = "orders@burgerhouse.local",
                Address = "5 Food St",
                Latitude = 0m,
                Longitude = 0m,
                IsOpen = true,
                IsApproved = true,
                UserId = restOwner.UserId
            };

            context.Restaurants.Add(restaurant);
            context.SaveChanges();

            // --- Menu Category ---
            var burgersCategory = new MenuCategory
            {
                Name = "Burgers",
                Description = "Beef and vegetarian burgers",
                RestaurantId = restaurant.RestaurantId
            };

            context.MenuCategories.Add(burgersCategory);
            context.SaveChanges();

            // --- Menu Items ---
            var item1 = new MenuItem
            {
                Name = "Classic Beef Burger",
                Description = "Beef patty, lettuce, tomato, special sauce",
                Price = 59.99m,
                IsAvailable = true,
                RestaurantId = restaurant.RestaurantId,
                MenuCategoryId = burgersCategory.MenuCategoryId
            };

            var item2 = new MenuItem
            {
                Name = "Veggie Burger",
                Description = "Plant-based patty, lettuce, tomato",
                Price = 49.50m,
                IsAvailable = true,
                RestaurantId = restaurant.RestaurantId,
                MenuCategoryId = burgersCategory.MenuCategoryId
            };

            context.MenuItems.AddRange(item1, item2);
            context.SaveChanges();
        }
    }
}