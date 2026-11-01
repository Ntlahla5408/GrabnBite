namespace GrabnBite.Models.Entities
{
    // Append-only record of important refund/reconciliation transitions.
    public class PaymentReconciliationEvent
    {
        public int PaymentReconciliationEventId { get; set; }

        public int PaymentId { get; set; }

        // Null for provider/system-generated events; populated for authenticated user actions.
        public int? ActorUserId { get; set; }

        public string ActorRole { get; set; } = "SYSTEM";

        public string EventType { get; set; } = string.Empty;

        public string RefundStatus { get; set; } = string.Empty;

        public string? ProviderReference { get; set; }

        public string Details { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Payment Payment { get; set; } = null!;
    }
}