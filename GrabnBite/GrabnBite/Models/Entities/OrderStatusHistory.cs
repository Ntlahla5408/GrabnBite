namespace GrabnBite.Models.Entities
{
    public class OrderStatusHistory
    {
        public int OrderStatusHistoryId { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        // Null means a system-generated change or an actor that no longer exists.
        public int? ChangedByUserId { get; set; }

        public string? ChangedByRole { get; set; }

        public int OrderId { get; set; }

        public Order Order { get; set; } = null!;
    }
}