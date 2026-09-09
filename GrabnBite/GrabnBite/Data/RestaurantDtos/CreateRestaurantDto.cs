namespace GrabnBite.DTOs.Restaurant

{
    public class CreateRestaurantDto
    {

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

    }
}
