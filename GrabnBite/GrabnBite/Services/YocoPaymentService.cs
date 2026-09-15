using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using GrabnBite.DTOs.Payment;
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

        public async Task<YocoCheckoutResponseDto> CreateCheckoutAsync(
            decimal amount,
            string currency,
            string successUrl,
            string cancelUrl)
        {
            if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            {
                throw new InvalidOperationException(
                    "Yoco SecretKey is not configured.");
            }

            if (amount <= 0)
            {
                throw new ArgumentException(
                    "Payment amount must be greater than zero.",
                    nameof(amount));
            }

            // --------------------------------------------------------
            // Yoco authentication
            // --------------------------------------------------------

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    _settings.SecretKey);

            // --------------------------------------------------------
            // Convert amount to cents
            // Example:
            // R250.50 -> 25050
            // --------------------------------------------------------

            var amountInCents =
                (int)Math.Round(amount * 100);

            // --------------------------------------------------------
            // Create Yoco checkout request
            // --------------------------------------------------------

            var requestBody = new
            {
                amount = amountInCents,
                currency = currency,
                successUrl = successUrl,
                cancelUrl = cancelUrl
            };

            var json = JsonSerializer.Serialize(requestBody);

            using var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            // --------------------------------------------------------
            // Send request to Yoco
            // --------------------------------------------------------
            Console.WriteLine("========== YOCO DEBUG ==========");
            Console.WriteLine($"Yoco Base URL: {_settings.BaseUrl}");
            Console.WriteLine($"Yoco Key Loaded: {!string.IsNullOrWhiteSpace(_settings.SecretKey)}");
            Console.WriteLine($"Yoco Key Length: {_settings.SecretKey?.Length}");
            Console.WriteLine($"Yoco Key Prefix: {_settings.SecretKey?.Substring(0, Math.Min(8, _settings.SecretKey.Length))}");
            Console.WriteLine($"Amount in cents: {amountInCents}");
            Console.WriteLine($"Currency: {currency}");
            Console.WriteLine("================================");
            var response = await _httpClient.PostAsync(
                $"{_settings.BaseUrl}/api/checkouts",
                content);

            var responseBody =
                await response.Content.ReadAsStringAsync();

            // --------------------------------------------------------
            // Handle Yoco error
            // --------------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Yoco checkout creation failed. " +
                    $"Status: {(int)response.StatusCode}. " +
                    $"Response: {responseBody}");
            }

            // --------------------------------------------------------
            // Deserialize Yoco response
            // --------------------------------------------------------

            var checkout =
                JsonSerializer.Deserialize<YocoCheckoutResponseDto>(
                    responseBody,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            if (checkout == null)
            {
                throw new InvalidOperationException(
                    "Yoco returned an invalid checkout response.");
            }

            if (string.IsNullOrWhiteSpace(checkout.Id))
            {
                throw new InvalidOperationException(
                    "Yoco checkout response did not contain a checkout ID.");
            }

            if (string.IsNullOrWhiteSpace(checkout.RedirectUrl))
            {
                throw new InvalidOperationException(
                    "Yoco checkout response did not contain a redirect URL.");
            }

            return checkout;
        }
    }
}