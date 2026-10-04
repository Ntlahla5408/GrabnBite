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

        public List<OrderItemResponseDto> OrderItems { get; set; } = new();
    }
}