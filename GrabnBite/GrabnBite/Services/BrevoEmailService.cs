using System.Net.Http.Json;
using GrabnBite.Configuration;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public interface IBrevoEmailService
    {
        Task SendTransactionalEmailAsync(
            string recipientEmail,
            string subject,
            string htmlContent,
            string? textContent = null,
            CancellationToken cancellationToken = default);
    }

    public sealed class BrevoEmailService : IBrevoEmailService
    {
        private static readonly Uri SendEmailEndpoint =
            new("https://api.brevo.com/v3/smtp/email");

        private readonly HttpClient httpClient;
        private readonly BrevoSettings settings;

        public BrevoEmailService(
            HttpClient httpClient,
            IOptions<BrevoSettings> settings)
        {
            this.httpClient = httpClient;
            this.settings = settings.Value;
        }

        public async Task SendTransactionalEmailAsync(
            string recipientEmail,
            string subject,
            string htmlContent,
            string? textContent = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(settings.ApiKey))
            {
                throw new InvalidOperationException(
                    "Brevo:ApiKey is not configured.");
            }

            if (string.IsNullOrWhiteSpace(settings.SenderEmail))
            {
                throw new InvalidOperationException(
                    "Brevo:SenderEmail is not configured.");
            }

            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                throw new ArgumentException(
                    "A recipient email address is required.",
                    nameof(recipientEmail));
            }

            if (string.IsNullOrWhiteSpace(subject))
            {
                throw new ArgumentException(
                    "An email subject is required.",
                    nameof(subject));
            }

            if (string.IsNullOrWhiteSpace(htmlContent))
            {
                throw new ArgumentException(
                    "HTML email content is required.",
                    nameof(htmlContent));
            }

            var payload = new
            {
                sender = new
                {
                    email = settings.SenderEmail,
                    name = string.IsNullOrWhiteSpace(settings.SenderName)
                        ? "GrabnBite"
                        : settings.SenderName
                },
                to = new[]
                {
                    new { email = recipientEmail.Trim() }
                },
                subject,
                htmlContent,
                textContent
            };

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                SendEmailEndpoint);

            request.Headers.TryAddWithoutValidation(
                "api-key",
                settings.ApiKey);

            request.Headers.Accept.ParseAdd("application/json");
            request.Content = JsonContent.Create(payload);

            using var response = await httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                // Do not include request headers, API key, or message content
                // in exceptions or logs.
                throw new HttpRequestException(
                    $"Brevo rejected the transactional email request with HTTP status {(int)response.StatusCode} ({response.StatusCode}).",
                    null,
                    response.StatusCode);
            }
        }
    }
}
