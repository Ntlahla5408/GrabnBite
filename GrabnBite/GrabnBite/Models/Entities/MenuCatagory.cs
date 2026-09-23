namespace GrabnBite.Models.Entities
{
    public class MenuCategory
    {
        public int MenuCategoryId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int RestaurantId { get; set; }

        public Restaurant Restaurant { get; set; } = null!;

        public ICollection<MenuItem> MenuItems { get; set; }
            = new List<MenuItem>();
    }
}