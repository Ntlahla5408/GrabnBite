namespace GrabnBite.DTOs.Order
{
    public class OrderResponseDto
    {
        public int OrderId { get; set; }

        public DateTime OrderDate { get; set; }

        public string Status { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int UserId { get; set; }

        public int RestaurantId { get; set; }

        public int DeliveryAddressId { get; set; }

        // Customer-safe payment and refund status; internal reconciliation details stay private.
        public string? PaymentStatus { get; set; }

        public string? PaymentMethod { get; set; }

        public string? RefundStatus { get; set; }

        public bool RequiresReconciliation { get; set; }

        public List<OrderItemResponseDto> OrderItems { get; set; } = new();
    }
}