namespace GrabnBite.Models.Entities
{
    public class MenuItem
    {
        public int MenuItemId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public bool IsAvailable { get; set; }

        // Foreign Keys
        public int RestaurantId { get; set; }

        public int MenuCategoryId { get; set; }

        // Relationships
        public Restaurant Restaurant { get; set; } = null!;

        public MenuCategory MenuCategory { get; set; } = null!;

        // An item can appear in many order items
        public ICollection<OrderItem> OrderItems { get; set; }
            = new List<OrderItem>();
    }
}
