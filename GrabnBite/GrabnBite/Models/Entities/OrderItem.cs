namespace GrabnBite.Models.Entities
{
    public class OrderItem
    {
        public int OrderItemId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }

        // Foreign Keys
        public int OrderId { get; set; }

        public int MenuItemId { get; set; }

        // Relationships
        public Order Order { get; set; } = null!;

        public MenuItem MenuItem { get; set; } = null!;
    }
}
