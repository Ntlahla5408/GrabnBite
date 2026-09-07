namespace GrabnBite.Models.Entities
{
    public class Driver
    {
        public int DriverId { get; set; }

        public string VehicleType { get; set; } = string.Empty;

        public string VehicleRegistration { get; set; } = string.Empty;

        public bool IsOnline { get; set; }

        public bool IsApproved { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        public int UserId { get; set; }

        // Relationship with User
        public User User { get; set; } = null!;

        // A driver can have many deliveries
        public ICollection<Delivery> Deliveries { get; set; }
            = new List<Delivery>();
    }
}
