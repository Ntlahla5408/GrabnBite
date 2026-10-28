using GrabnBite.Configuration;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;

namespace GrabnBite.Services
{
    public sealed class StripePaymentService
    {
        private readonly HttpClient _httpClient;
        private readonly StripeSettings _settings;

        public StripePaymentService(HttpClient httpClient, IOptions<StripeSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_settings.SecretKey) &&
            !string.IsNullOrWhiteSpace(_settings.WebhookSecret);

        public async Task<StripeIntentResult> CreatePaymentIntentAsync(
            int paymentId,
            int orderId,
            decimal amount,
            string idempotencyKey,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.SecretKey))
                throw new InvalidOperationException("Stripe secret key is not configured.");

            var centsDecimal = amount * 100m;
            if (centsDecimal != decimal.Truncate(centsDecimal) ||
                centsDecimal <= 0 ||
                centsDecimal > long.MaxValue)
                throw new InvalidOperationException("Payment amount cannot be represented as a valid amount in cents.");

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/payment_intents");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);
            request.Headers.Add("Idempotency-Key", idempotencyKey);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["amount"] = decimal.ToInt64(centsDecimal).ToString(CultureInfo.InvariantCulture),
                ["currency"] = "zar",
                ["automatic_payment_methods[enabled]"] = "true",
                ["metadata[paymentId]"] = paymentId.ToString(CultureInfo.InvariantCulture),
                ["metadata[orderId]"] = orderId.ToString(CultureInfo.InvariantCulture)
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new StripeProviderException((int)response.StatusCode, responseBody);

            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            var intentId = root.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
            var clientSecret = root.TryGetProperty("client_secret", out var secretElement) ? secretElement.GetString() : null;
            var returnedAmount = root.TryGetProperty("amount", out var amountElement) ? amountElement.GetInt64() : -1;
            var currency = root.TryGetProperty("currency", out var currencyElement) ? currencyElement.GetString() : null;

            if (string.IsNullOrWhiteSpace(intentId) || string.IsNullOrWhiteSpace(clientSecret) ||
                returnedAmount != decimal.ToInt64(centsDecimal) ||
                !string.Equals(currency, "zar", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Stripe returned a PaymentIntent that did not match the requested amount and currency.");

            return new StripeIntentResult(intentId, clientSecret, returnedAmount, currency);
        }

        public bool VerifyWebhookSignature(string payload, string signatureHeader)
        {
            if (string.IsNullOrWhiteSpace(_settings.WebhookSecret) ||
                string.IsNullOrWhiteSpace(signatureHeader))
                return false;

            try
            {
                var values = signatureHeader.Split(',')
                    .Select(part => part.Split('=', 2))
                    .Where(parts => parts.Length == 2)
                    .GroupBy(parts => parts[0])
                    .ToDictionary(group => group.Key, group => group.Select(parts => parts[1]).ToArray());

                if (!values.TryGetValue("t", out var timestamps) ||
                    !long.TryParse(timestamps.FirstOrDefault(), NumberStyles.None, CultureInfo.InvariantCulture, out var timestamp) ||
                    !values.TryGetValue("v1", out var signatures))
                    return false;

                var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                if (Math.Abs(now - timestamp) > 300)
                    return false;

                using var hmac = new System.Security.Cryptography.HMACSHA256(
                    System.Text.Encoding.UTF8.GetBytes(_settings.WebhookSecret));
                var signedPayload = $"{timestamp}.{payload}";
                var expected = Convert.ToHexString(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(signedPayload))).ToLowerInvariant();

                return signatures.Any(signature =>
                {
                    try
                    {
                        var left = Convert.FromHexString(expected);
                        var right = Convert.FromHexString(signature);
                        return left.Length == right.Length &&
                            System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(left, right);
                    }
                    catch (FormatException)
                    {
                        return false;
                    }
                });
            }
            catch (Exception ex) when (ex is FormatException || ex is ArgumentException)
            {
                return false;
            }
        }
    }

    public sealed record StripeIntentResult(string Id, string ClientSecret, long Amount, string? Currency);

    public sealed class StripeProviderException : Exception
    {
        public int StatusCode { get; }

        public StripeProviderException(int statusCode, string responseBody)
            : base($"Stripe API returned HTTP {statusCode}: {responseBody}")
        {
            StatusCode = statusCode;
        }
    }
}
