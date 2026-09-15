using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public class YocoPaymentService
    {
        private readonly HttpClient _httpClient;
        private readonly YocoSettings _settings;

        public YocoPaymentService(
            HttpClient httpClient,
            IOptions<YocoSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<string> CreateCheckoutAsync(
            decimal amount,
            string currency,
            string successUrl,
            string cancelUrl)
        {
            if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            {
                throw new InvalidOperationException("Yoco SecretKey is not configured.");
            }

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

            var requestBody = new
            {
                amountInCents = (int)Math.Round(amount * 100),
                currency = currency,
                successUrl = successUrl,
                cancelUrl = cancelUrl
            };

            var json = JsonSerializer.Serialize(requestBody);

            using var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(
                "https://payments.yoco.com/api/checkouts",
                content);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Yoco checkout creation failed: {responseBody}");
            }

            return responseBody;
        }
    }
}