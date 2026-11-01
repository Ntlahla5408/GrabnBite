namespace GrabnBite.Models.Entities
{
    public class MenuItem
    {
        public int MenuItemId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public bool IsAvailable { get; set; } = true;

        // Cloudinary asset identifier used for safe replacement and deletion.
        public string? ImageUrl { get; set; }

        public string? ImagePublicId { get; set; }

        // Foreign Keys
        public int RestaurantId { get; set; }

        public int MenuCategoryId { get; set; }

        // Relationships
        public Restaurant Restaurant { get; set; } = null!;

        public MenuCategory MenuCategory { get; set; } = null!;

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}