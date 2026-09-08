namespace GrabnBite.Models.Entities
{
    public class Order
    {
        public int OrderId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "PENDING";

        public decimal TotalAmount { get; set; }

        public int UserId { get; set; }
        public int RestaurantId { get; set; }
        public int DeliveryAddressId { get; set; }

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