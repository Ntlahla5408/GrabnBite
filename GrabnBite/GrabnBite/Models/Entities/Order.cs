namespace GrabnBite.Models.Entities
{
    public class Order
    {
        public int OrderId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "PENDING";

        public decimal TotalAmount { get; set; }

        // Foreign Keys
        public int UserId { get; set; }

        public int RestaurantId { get; set; }

        public int DeliveryAddressId { get; set; }

        // Immutable snapshot captured at checkout; saved addresses may change later.
        public string DeliveryAddressLabel { get; set; } = string.Empty;
        public string DeliveryStreetAddress { get; set; } = string.Empty;
        public string DeliveryCity { get; set; } = string.Empty;
        public string DeliveryProvince { get; set; } = string.Empty;
        public string DeliveryPostalCode { get; set; } = string.Empty;
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }

        // Relationships
        public User User { get; set; } = null!;

        public Restaurant Restaurant { get; set; } = null!;

        public Address DeliveryAddress { get; set; } = null!;

        public ICollection<OrderItem> OrderItems { get; set; }
            = new List<OrderItem>();

        public ICollection<OrderStatusHistory> StatusHistory { get; set; }
            = new List<OrderStatusHistory>();

        public Payment? Payment { get; set; }

        public Delivery? Delivery { get; set; }

        public Review? Review { get; set; }
    }
}