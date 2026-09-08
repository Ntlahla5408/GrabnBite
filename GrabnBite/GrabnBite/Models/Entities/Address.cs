namespace GrabnBite.Models.Entities
{
    public class Address
    {
        public int AddressId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsDefault { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
