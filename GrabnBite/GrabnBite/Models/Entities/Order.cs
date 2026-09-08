namespace GrabnBite.Models.Entities
{
    public class Order
    {
        public int OrderId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "PREPARING";
        public decimal TotalAmount { get; set; }
        // Foreign Keys
        public int UserId { get; set; }
        public int RestaurantId { get; set; }
        public int DeliveryAddressId { get; set; }
        // Relationships
        public User User { get; set; } = null!;
        public Restaurant Restaurant { get; set; } = null!;
        public Address DeliveryAddress { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; }
            = new List<OrderItem>();
        public Payment? Payment { get; set; }
        public Delivery? Delivery { get; set; }
        public Review? Review { get; set; }
    }
}