namespace GrabnBite.Models.Entities
{
    public class Driver
    {
        public int DriverId { get; set; }

        public string VehicleType { get; set; } = string.Empty;

        public string VehicleRegistration { get; set; } = string.Empty;

        public bool IsOnline { get; set; } = false;

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        public ICollection<Delivery> Deliveries { get; set; }
            = new List<Delivery>();
    }
}