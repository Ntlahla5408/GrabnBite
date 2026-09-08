namespace GrabnBite.DTOs.Delivery
{
    public class DeliveryResponseDto
    {
        public int DeliveryId { get; set; }

        public int OrderId { get; set; }

        public int? DriverId { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime? PickedUpAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        public double? DriverLatitude { get; set; }

        public double? DriverLongitude { get; set; }
    }
}