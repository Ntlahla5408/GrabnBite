namespace GrabnBite.DTOs.Driver
{
    public class DriverResponseDto
    {
        public int DriverId { get; set; }

        public int UserId { get; set; }

        public string VehicleType { get; set; } = string.Empty;

        public string VehicleRegistration { get; set; } = string.Empty;

        public bool IsOnline { get; set; }

        public bool IsApproved { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}