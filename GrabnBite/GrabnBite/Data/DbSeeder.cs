using BCrypt.Net;
using GrabnBite.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // ============================================================
            // ROLES
            // ============================================================

            var roleNames = new[]
            {
                "Customer",
                "Restaurant",
                "Driver",
                "Admin"
            };

            foreach (var roleName in roleNames)
            {
                if (!await context.Roles.AnyAsync(r => r.Name == roleName))
                {
                    context.Roles.Add(new Role
                    {
                        Name = roleName,
                        Description = $"{roleName} role"
                    });
                }
            }

            await context.SaveChangesAsync();

            // ============================================================
            // GET ROLES
            // ============================================================

            var customerRole = await context.Roles
                .FirstAsync(r => r.Name == "Customer");

            var restaurantRole = await context.Roles
                .FirstAsync(r => r.Name == "Restaurant");

            var driverRole = await context.Roles
                .FirstAsync(r => r.Name == "Driver");

            var adminRole = await context.Roles
                .FirstAsync(r => r.Name == "Admin");

            // ============================================================
            // USERS
            // ============================================================

            var customer = await context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == "customer@grabnbite.com");

            if (customer == null)
            {
                customer = new User
                {
                    FirstName = "Ntlahla",
                    LastName = "Customer",
                    Email = "customer@grabnbite.com",
                    PhoneNumber = "0712345678",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    RoleId = customerRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(customer);
            }

            var restaurantUser = await context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == "restaurant@grabnbite.com");

            if (restaurantUser == null)
            {
                restaurantUser = new User
                {
                    FirstName = "John",
                    LastName = "Restaurant",
                    Email = "restaurant@grabnbite.com",
                    PhoneNumber = "0723456789",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    RoleId = restaurantRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(restaurantUser);
            }

            var driverUser = await context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == "driver@grabnbite.com");

            if (driverUser == null)
            {
                driverUser = new User
                {
                    FirstName = "David",
                    LastName = "Driver",
                    Email = "driver@grabnbite.com",
                    PhoneNumber = "0734567890",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    RoleId = driverRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(driverUser);
            }

            var adminUser = await context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == "admin@grabnbite.com");

            if (adminUser == null)
            {
                adminUser = new User
                {
                    FirstName = "Admin",
                    LastName = "GrabnBite",
                    Email = "admin@grabnbite.com",
                    PhoneNumber = "0745678901",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    RoleId = adminRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Users.AddAsync(adminUser);
            }

            await context.SaveChangesAsync();

            // ============================================================
            // RESTAURANT
            // ============================================================

            var restaurant = await context.Restaurants
                .FirstOrDefaultAsync(x =>
                    x.Email == "restaurant@grabnbite.com");

            if (restaurant == null)
            {
                restaurant = new Restaurant
                {
                    Name = "Burger King Walmer",
                    Description =
                        "Fast food restaurant serving burgers, meals and drinks.",
                    PhoneNumber = "0411234567",
                    Email = "restaurant@grabnbite.com",
                    Address = "Main Road, Walmer, Gqeberha",
                    Latitude = -33.9847m,
                    Longitude = 25.5950m,
                    IsOpen = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UserId = restaurantUser.UserId,
                    ImageUrl = null
                };

                await context.Restaurants.AddAsync(restaurant);
                await context.SaveChangesAsync();
            }

            // ============================================================
            // DRIVER
            // ============================================================

            if (!await context.Drivers
                .AnyAsync(x => x.UserId == driverUser.UserId))
            {
                var driver = new Driver
                {
                    VehicleType = "Motorcycle",
                    VehicleRegistration = "CA 123-456",
                    IsOnline = true,
                    IsApproved = true,
                    CreatedAt = DateTime.UtcNow,
                    UserId = driverUser.UserId
                };

                await context.Drivers.AddAsync(driver);
                await context.SaveChangesAsync();
            }

            // ============================================================
            // CUSTOMER ADDRESS
            // ============================================================

            if (!await context.Addresses
                .AnyAsync(x => x.UserId == customer.UserId))
            {
                var address = new Address
                {
                    Label = "Home",
                    StreetAddress = "10 Main Street",
                    City = "Gqeberha",
                    Province = "Eastern Cape",
                    PostalCode = "6070",
                    Latitude = -33.9608,
                    Longitude = 25.6022,
                    IsDefault = true,
                    UserId = customer.UserId
                };

                await context.Addresses.AddAsync(address);
                await context.SaveChangesAsync();
            }

            // ============================================================
            // MENU CATEGORIES
            // ============================================================

            var burgersCategory = await context.MenuCategories
                .FirstOrDefaultAsync(x =>
                    x.RestaurantId == restaurant.RestaurantId &&
                    x.Name == "Burgers");

            if (burgersCategory == null)
            {
                burgersCategory = new MenuCategory
                {
                    Name = "Burgers",
                    Description = "Classic and signature burgers.",
                    RestaurantId = restaurant.RestaurantId
                };

                await context.MenuCategories.AddAsync(burgersCategory);
                await context.SaveChangesAsync();
            }

            var mealsCategory = await context.MenuCategories
                .FirstOrDefaultAsync(x =>
                    x.RestaurantId == restaurant.RestaurantId &&
                    x.Name == "Meals");

            if (mealsCategory == null)
            {
                mealsCategory = new MenuCategory
                {
                    Name = "Meals",
                    Description = "Complete meals with sides and drinks.",
                    RestaurantId = restaurant.RestaurantId
                };

                await context.MenuCategories.AddAsync(mealsCategory);
                await context.SaveChangesAsync();
            }

            var drinksCategory = await context.MenuCategories
                .FirstOrDefaultAsync(x =>
                    x.RestaurantId == restaurant.RestaurantId &&
                    x.Name == "Drinks");

            if (drinksCategory == null)
            {
                drinksCategory = new MenuCategory
                {
                    Name = "Drinks",
                    Description = "Cold drinks and refreshments.",
                    RestaurantId = restaurant.RestaurantId
                };

                await context.MenuCategories.AddAsync(drinksCategory);
                await context.SaveChangesAsync();
            }

            // ============================================================
            // MENU ITEMS
            // ============================================================

            if (!await context.MenuItems
                .AnyAsync(x => x.RestaurantId == restaurant.RestaurantId))
            {
                var menuItems = new List<MenuItem>
                {
                    new MenuItem
                    {
                        Name = "Classic Beef Burger",
                        Description =
                            "Beef patty with lettuce, tomato and sauce.",
                        Price = 59.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = burgersCategory.MenuCategoryId
                    },

                    new MenuItem
                    {
                        Name = "Chicken Burger",
                        Description =
                            "Crispy chicken burger with lettuce and mayo.",
                        Price = 64.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = burgersCategory.MenuCategoryId
                    },

                    new MenuItem
                    {
                        Name = "Whopper Meal",
                        Description =
                            "Whopper burger served with chips and a drink.",
                        Price = 89.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = mealsCategory.MenuCategoryId
                    },

                    new MenuItem
                    {
                        Name = "Chicken Meal",
                        Description =
                            "Chicken burger served with chips and a drink.",
                        Price = 84.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = mealsCategory.MenuCategoryId
                    },

                    new MenuItem
                    {
                        Name = "Coca-Cola",
                        Description = "500ml Coca-Cola.",
                        Price = 19.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = drinksCategory.MenuCategoryId
                    },

                    new MenuItem
                    {
                        Name = "Sprite",
                        Description = "500ml Sprite.",
                        Price = 19.99m,
                        IsAvailable = true,
                        RestaurantId = restaurant.RestaurantId,
                        MenuCategoryId = drinksCategory.MenuCategoryId
                    }
                };

                await context.MenuItems.AddRangeAsync(menuItems);
                await context.SaveChangesAsync();
            }

            // ============================================================
            // FINISHED
            // ============================================================

            Console.WriteLine("========================================");
            Console.WriteLine("GrabnBite database seeding completed.");
            Console.WriteLine("========================================");
            Console.WriteLine("Test accounts:");
            Console.WriteLine("Customer:   customer@grabnbite.com");
            Console.WriteLine("Restaurant: restaurant@grabnbite.com");
            Console.WriteLine("Driver:     driver@grabnbite.com");
            Console.WriteLine("Admin:      admin@grabnbite.com");
            Console.WriteLine("Password:   Password123!");
            Console.WriteLine("========================================");
        }
    }
}