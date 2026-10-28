namespace GrabnBite.Models.Entities
{
    // Stores provider event IDs so webhook retries cannot apply the same transition twice.
    public class ProcessedPaymentProviderEvent
    {
        public int ProcessedPaymentProviderEventId { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string EventId { get; set; } = string.Empty;
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }
}
