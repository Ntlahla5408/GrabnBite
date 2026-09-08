namespace GrabnBite.Models.Entities
{
    public class Delivery
    {
        public int DeliveryId { get; set; }

        public string Status { get; set; } = "SEARCHING_FOR_DRIVER";

        public DateTime? PickedUpAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        public double? DriverLatitude { get; set; }

        public double? DriverLongitude { get; set; }

        public int OrderId { get; set; }

        public int? DriverId { get; set; }

        public Order Order { get; set; } = null!;

        public Driver? Driver { get; set; }
    }
}
