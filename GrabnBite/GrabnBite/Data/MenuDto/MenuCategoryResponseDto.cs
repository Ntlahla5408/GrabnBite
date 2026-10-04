namespace GrabnBite.DTOs.Menu
{
    public class MenuCategoryResponseDto
    {
        public int MenuCategoryId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int RestaurantId { get; set; }
    }
}
