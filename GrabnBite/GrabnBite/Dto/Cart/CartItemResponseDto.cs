namespace GrabnBite.DTOs.Cart
{
    public class CartItemResponseDto
    {
        public int CartItemId { get; set; }

        public int MenuItemId { get; set; }

        public string MenuItemName { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }
    }
}