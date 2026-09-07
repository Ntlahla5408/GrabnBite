namespace GrabnBite.DTOs.Order
{
    public class CreateOrderDto
    {
        public int RestaurantId { get; set; }

        public int DeliveryAddressId { get; set; }

        public List<CreateOrderItemDto> OrderItems { get; set; } = new();
    }
}
