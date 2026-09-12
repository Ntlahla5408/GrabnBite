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

            // --- Restaurant (Burger House) ---
            var restaurant = context.Restaurants.FirstOrDefault(r => r.Email == "burgerking.co.za");
            if (restaurant == null)
            {
                restaurant = new Restaurant
                {
                    Name = "Burger King Walmer",
                    Description = "Fast-food restaurant company",
                    PhoneNumber = "+27112223333",
                    Email = "burgerking.co.za",
                    Address = "108 Heugh Rd, Walmer, Gqeberha, 6070",
                    Latitude = 0m,
                    Longitude = 0m,
                    IsOpen = true,
                    IsApproved = true,
                    UserId = restOwner.UserId
                };

                context.Restaurants.Add(restaurant);
                context.SaveChanges();
            }

            // --- Restaurant (Pizza House) ---
            var restaurant1 = context.Restaurants.FirstOrDefault(r => r.Email == "debonairspizza.co.za");
            if (restaurant1 == null)
            {
                restaurant1 = new Restaurant
                {
                    Name = "Debonairs Pizza Summerstrand Village",
                    Description = "Test pizzas and pies",
                    PhoneNumber = "0415831490",
                    Email = "debonairspizza.co.za",   
                    Address = "Shop 8, 8th Ave, Summerstrand, Gqeberha, 6001",
                    Latitude = 0m,
                    Longitude = 0m,
                    IsOpen = true,
                    IsApproved = true,
                    UserId = restOwner.UserId
                };

                context.Restaurants.Add(restaurant1);
                context.SaveChanges();
            }

            // --- Create separate owners for additional restaurants (one-to-one relationship) ---
            var sushiOwner = context.Users.FirstOrDefault(u => u.Email == "owner@sushi.local");
            if (sushiOwner == null)
            {
                sushiOwner = new User
                {
                    FirstName = "Sushi",
                    LastName = "Owner",
                    Email = "owner@sushi.local",
                    PhoneNumber = "+27110001111",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("SushiOwner123!"),
                    Role = "Restaurant",
                    IsActive = true
                };
                context.Users.Add(sushiOwner);
            }

            var tacoOwner = context.Users.FirstOrDefault(u => u.Email == "owner@taco.local");
            if (tacoOwner == null)
            {
                tacoOwner = new User
                {
                    FirstName = "Taco",
                    LastName = "Owner",
                    Email = "owner@taco.local",
                    PhoneNumber = "+27110002222",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("TacoOwner123!"),
                    Role = "Restaurant",
                    IsActive = true
                };
                context.Users.Add(tacoOwner);
            }

            context.SaveChanges();

            // --- New: KFC Summerstrand Village ---
            var restaurant2 = context.Restaurants.FirstOrDefault(r => r.Email == "kfcsummerstrandvillage@kfc.co.za");
            if (restaurant2 == null)
            {
                restaurant2 = new Restaurant
                {
                    Name = "KFC Summerstrand Village",
                    Description = "Fast food restaurant",
                    PhoneNumber = "0418800344",
                    Email = "kfcsummerstrandvillage@kfc.co.za",
                    Address = "8th Ave &, Marine Dr, Summerstrand, Gqeberha, 6001",
                    Latitude = 0m,
                    Longitude = 0m,
                    IsOpen = true,
                    IsApproved = true,
                    UserId = sushiOwner.UserId
                };

                context.Restaurants.Add(restaurant2);
                context.SaveChanges();
            }

            // --- New: McDonald’s Walmer ---
            var restaurant3 = context.Restaurants.FirstOrDefault(r => r.Email == "mcdonaldswalmer@co.za");
            if (restaurant3 == null)
            {
                restaurant3 = new Restaurant
                {
                    Name = "McDonald’s Walmer",
                    Description = "Classic, long-running fast-food chain known for its burgers & fries",
                    PhoneNumber = "+27112226666",
                    Email = "mcdonaldswalmer@co.za",
                    Address = "59 Heugh Rd, Walmer, Gqeberha, 6065",
                    Latitude = 0m,
                    Longitude = 0m,
                    IsOpen = true,
                    IsApproved = true,
                    UserId = tacoOwner.UserId
                };

                context.Restaurants.Add(restaurant3);
                context.SaveChanges();
            }

            // --- Menu Category for Burger House ---
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

            // --- Menu Category for Sushi Corner ---
            var sushiCategory = context.MenuCategories.FirstOrDefault(mc =>
                mc.RestaurantId == restaurant2.RestaurantId && mc.Name == "Sushi");
            if (sushiCategory == null)
            {
                sushiCategory = new MenuCategory
                {
                    Name = "Sushi",
                    Description = "Nigiri, maki and specialty rolls",
                    RestaurantId = restaurant2.RestaurantId
                };

                context.MenuCategories.Add(sushiCategory);
                context.SaveChanges();
            }

            // --- Menu Category for Taco Town ---
            var tacosCategory = context.MenuCategories.FirstOrDefault(mc =>
                mc.RestaurantId == restaurant3.RestaurantId && mc.Name == "Tacos");
            if (tacosCategory == null)
            {
                tacosCategory = new MenuCategory
                {
                    Name = "Tacos",
                    Description = "Assorted tacos and combos",
                    RestaurantId = restaurant3.RestaurantId
                };

                context.MenuCategories.Add(tacosCategory);
                context.SaveChanges();
            }

            // --- Menu Items for Burger House ---
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

            // --- Menu Items for Sushi Corner ---
            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant2.RestaurantId && mi.Name == "Salmon Nigiri"))
            {
                var s1 = new MenuItem
                {
                    Name = "Salmon Nigiri",
                    Description = "Fresh salmon over pressed sushi rice (2 pcs)",
                    Price = 29.99m,
                    IsAvailable = true,
                    RestaurantId = restaurant2.RestaurantId,
                    MenuCategoryId = sushiCategory.MenuCategoryId
                };

                context.MenuItems.Add(s1);
            }

            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant2.RestaurantId && mi.Name == "California Roll"))
            {
                var s2 = new MenuItem
                {
                    Name = "California Roll",
                    Description = "Crab, avocado, cucumber roll (8 pcs)",
                    Price = 39.50m,
                    IsAvailable = true,
                    RestaurantId = restaurant2.RestaurantId,
                    MenuCategoryId = sushiCategory.MenuCategoryId
                };

                context.MenuItems.Add(s2);
            }

            // --- Menu Items for Taco Town ---
            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant3.RestaurantId && mi.Name == "Chicken Taco"))
            {
                var t1 = new MenuItem
                {
                    Name = "Chicken Taco",
                    Description = "Grilled chicken, pico de gallo, lime",
                    Price = 24.99m,
                    IsAvailable = true,
                    RestaurantId = restaurant3.RestaurantId,
                    MenuCategoryId = tacosCategory.MenuCategoryId
                };

                context.MenuItems.Add(t1);
            }

            if (!context.MenuItems.Any(mi =>
                mi.RestaurantId == restaurant3.RestaurantId && mi.Name == "Beef Taco"))
            {
                var t2 = new MenuItem
                {
                    Name = "Beef Taco",
                    Description = "Spiced beef, onions, cilantro",
                    Price = 26.50m,
                    IsAvailable = true,
                    RestaurantId = restaurant3.RestaurantId,
                    MenuCategoryId = tacosCategory.MenuCategoryId
                };

                context.MenuItems.Add(t2);
            }

            context.SaveChanges();
        }
    }
}