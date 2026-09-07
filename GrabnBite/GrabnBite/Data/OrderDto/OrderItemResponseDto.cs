namespace GrabnBite.DTOs.Order
{
    public class OrderItemResponseDto
    {
        public int OrderItemId { get; set; }

        public int MenuItemId { get; set; }

        public string MenuItemName { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }
    }
}
