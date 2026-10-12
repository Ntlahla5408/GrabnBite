namespace GrabnBite.Configuration
{
    public class YocoSettings
    {
        public string SecretKey { get; set; } = string.Empty;

        public string BaseUrl { get; set; } =
            "https://payments.yoco.com";

        // Yoco returns to these HTTPS API endpoints. The endpoints then
        // open the corresponding screen in the GrabnBite mobile app.
        public string SuccessUrl { get; set; } =
            "https://grubnbite.onrender.com/api/Payment/yoco/success";

        public string CancelUrl { get; set; } =
            "https://grubnbite.onrender.com/api/Payment/yoco/cancel";

        // Yoco webhook signing secret (whsec_...). Keep in Render environment variables.
        public string WebhookSecret { get; set; } = string.Empty;
    }
}
