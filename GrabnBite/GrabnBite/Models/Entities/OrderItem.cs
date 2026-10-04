namespace GrabnBite.Models.Entities
{
    public class OrderItem
    {
        public int OrderItemId { get; set; }

        public string ItemName { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }

        public int OrderId { get; set; }

        public int MenuItemId { get; set; }

        public Order Order { get; set; } = null!;

        public MenuItem MenuItem { get; set; } = null!;
    }
}