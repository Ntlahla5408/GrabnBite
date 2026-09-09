namespace GrabnBite.Models.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public decimal Amount { get; set; }

        public string PaymentStatus { get; set; } = "INITIATED";

        public string PaymentMethod { get; set; } = string.Empty;

        public string PaymentReference { get; set; } = string.Empty;

        public string? TransactionReference { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public int OrderId { get; set; }

        public Order Order { get; set; } = null!;
    }
}