namespace GrabnBite.DTOs.Restaurant

{
    public class CreateRestaurantDto
    {

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;
        
        public string Email { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }

    }
}
