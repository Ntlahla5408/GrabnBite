namespace GrabnBite.DTOs.Payment
{
    public class YocoCheckoutStatusDto
    {
        public string Id { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public int Amount { get; set; }

        public string Currency { get; set; } = string.Empty;

        public string? RedirectUrl { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}