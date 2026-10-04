namespace GrabnBite.DTOs.Cart
{
    public class CartResponseDto
    {
        public int CartId { get; set; }

        public int RestaurantId { get; set; }

        public string RestaurantName { get; set; } = string.Empty;

        public List<CartItemResponseDto> Items { get; set; }
            = new List<CartItemResponseDto>();

        public decimal TotalAmount { get; set; }
    }
}