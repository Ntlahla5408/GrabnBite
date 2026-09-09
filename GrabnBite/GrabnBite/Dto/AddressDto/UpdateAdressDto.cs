namespace GrabnBite.Dto.AddressDto
{
    public class UpdateAddressDto
    {
        public string Label { get; set; } = string.Empty;

        public string StreetAddress { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string Province { get; set; } = string.Empty;

        public string PostalCode { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }
    }
}