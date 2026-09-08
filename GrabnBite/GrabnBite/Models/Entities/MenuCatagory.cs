namespace GrabnBite.Models.Entities
{
    public class MenuCategory
    {
        public int MenuCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        // Foreign Key
        public int RestaurantId { get; set; }
        // Relationship
        public Restaurant Restaurant { get; set; } = null!;
        // A category can contain many menu items
        public ICollection<MenuItem> MenuItems { get; set; }
            = new List<MenuItem>();
    }
}
