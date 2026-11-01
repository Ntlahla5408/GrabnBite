namespace GrabnBite.Models.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public decimal Amount { get; set; }

        public string PaymentStatus { get; set; } = "INITIATED";

        public string PaymentMethod { get; set; } = "YOCO";

        public string? PaymentReference { get; set; }

        public string? TransactionReference { get; set; }

        public string? YocoCheckoutId { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        // Durable refund lifecycle. NOT_REQUIRED is the default for payments
        // that have not entered a refund workflow.
        public string RefundStatus { get; set; } = "NOT_REQUIRED";

        public decimal? RefundAmount { get; set; }

        public DateTime? RefundRequiredAt { get; set; }

        public string? RefundProvider { get; set; }

        public string? RefundProviderReference { get; set; }

        public DateTime? RefundRequestedAt { get; set; }

        public DateTime? RefundCompletedAt { get; set; }

        public DateTime? RefundFailedAt { get; set; }

        // Durable reconciliation queue state for payment/order inconsistencies.
        public bool RequiresReconciliation { get; set; }

        public string? ReconciliationReason { get; set; }

        public DateTime? ReconciliationOpenedAt { get; set; }

        public DateTime? ReconciliationResolvedAt { get; set; }

        public string? ReconciliationResolutionNotes { get; set; }

        public ICollection<PaymentReconciliationEvent> ReconciliationEvents { get; set; }
            = new List<PaymentReconciliationEvent>();

        // Foreign Key
        public int OrderId { get; set; }

        // Relationship
        public Order Order { get; set; } = null!;
    }
}