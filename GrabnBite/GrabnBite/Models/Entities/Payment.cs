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

        // Foreign Key
        public int OrderId { get; set; }

        // Relationship
        public Order Order { get; set; } = null!;
    }
}