namespace GrabnBite.Models.Entities
{
    public class Restaurant
    {
        public int RestaurantId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public bool IsOpen { get; set; }
        public bool IsApproved { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Restaurant account owner
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<MenuCategory> MenuCategories { get; set; } = new List<MenuCategory>();
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}