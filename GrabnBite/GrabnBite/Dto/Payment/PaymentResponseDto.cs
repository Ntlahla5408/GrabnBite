namespace GrabnBite.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }

        public int OrderId { get; set; }

        public decimal Amount { get; set; }

        public string PaymentStatus { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = string.Empty;

        public string PaymentReference { get; set; } = string.Empty;

        public string? TransactionReference { get; set; }

        public string? YocoCheckoutId { get; set; }

        public string? RedirectUrl { get; set; }

        public DateTime PaymentDate { get; set; }
    }
}