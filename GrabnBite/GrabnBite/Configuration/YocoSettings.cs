namespace GrabnBite.Configuration
{
    public class YocoSettings
    {
        public string SecretKey { get; set; } = string.Empty;

        public string BaseUrl { get; set; } =
            "https://payments.yoco.com";
    }
}