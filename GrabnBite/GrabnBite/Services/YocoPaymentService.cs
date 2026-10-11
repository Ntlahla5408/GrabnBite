using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using GrabnBite.DTOs.Payment;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace GrabnBite.Services
{
    public class YocoPaymentService
    {
        private readonly HttpClient _httpClient;
        private readonly YocoSettings _settings;
        private readonly ILogger<YocoPaymentService> _logger;

        public YocoPaymentService(
            HttpClient httpClient,
            IOptions<YocoSettings> settings,
            ILogger<YocoPaymentService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
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

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_settings.BaseUrl.TrimEnd('/')}/api/checkouts");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

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
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            // Send the request without logging credentials or payment payloads.
            var response = await _httpClient.SendAsync(request);

            var responseBody =
                await response.Content.ReadAsStringAsync();

            // --------------------------------------------------------
            // Handle Yoco error
            // --------------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Yoco checkout creation returned HTTP {StatusCode}", (int)response.StatusCode);
                throw new HttpRequestException($"Yoco checkout creation failed with HTTP {(int)response.StatusCode}.");
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

        public async Task<YocoCheckoutStatusDto> GetCheckoutStatusAsync(
    string checkoutId)
        {
            if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            {
                throw new InvalidOperationException(
                    "Yoco SecretKey is not configured.");
            }

            if (string.IsNullOrWhiteSpace(checkoutId))
            {
                throw new ArgumentException(
                    "Yoco checkout ID is required.",
                    nameof(checkoutId));
            }

            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"{_settings.BaseUrl.TrimEnd('/')}/api/checkouts/{Uri.EscapeDataString(checkoutId)}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);
            var response = await _httpClient.SendAsync(request);

            var responseBody =
                await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Yoco checkout status request returned HTTP {StatusCode}", (int)response.StatusCode);
                throw new HttpRequestException($"Yoco checkout status request failed with HTTP {(int)response.StatusCode}.");
            }

            var checkout =
                JsonSerializer.Deserialize<YocoCheckoutStatusDto>(
                    responseBody,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            if (checkout == null)
            {
                throw new InvalidOperationException(
                    "Yoco returned an invalid checkout status response.");
            }

            return checkout;
        }
    }
}