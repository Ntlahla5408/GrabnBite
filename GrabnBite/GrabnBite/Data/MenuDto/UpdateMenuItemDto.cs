namespace GrabnBite.DTOs.Menu
{
    public class UpdateMenuItemDto
    {
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public bool IsAvailable { get; set; }
    }
}
