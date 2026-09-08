namespace GrabnBite.Models.Entities
{
    public class OrderStatusHistory
    {
        public int OrderStatusHistoryId { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public int OrderId { get; set; }

        public Order Order { get; set; } = null!;
    }
}