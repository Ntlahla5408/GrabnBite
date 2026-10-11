namespace GrabnBite.Configuration
{
    public class YocoSettings
    {
        public string SecretKey { get; set; } = string.Empty;

        public string BaseUrl { get; set; } =
            "https://payments.yoco.com";

        // Configure these as HTTPS URLs on the customer-facing website.
        public string SuccessUrl { get; set; } = "https://grubnbite.com/payment-success";

        public string CancelUrl { get; set; } = "https://grubnbite.com/payment-cancelled";

        // Yoco webhook signing secret (whsec_...). Keep in Render environment variables.
        public string WebhookSecret { get; set; } = string.Empty;
    }
}