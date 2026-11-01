using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public interface ICloudinaryImageService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(
            Stream imageStream,
            string fileName,
            string folder,
            CancellationToken cancellationToken = default);

        Task DeleteImageAsync(
            string publicId,
            CancellationToken cancellationToken = default);
    }

    public sealed record CloudinaryUploadResult(string SecureUrl, string PublicId);

    public class CloudinaryImageService : ICloudinaryImageService
    {
        private readonly HttpClient _httpClient;
        private readonly CloudinarySettings _settings;

        public CloudinaryImageService(
            HttpClient httpClient,
            IOptions<CloudinarySettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(
            Stream imageStream,
            string fileName,
            string folder,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                .ToString(CultureInfo.InvariantCulture);

            var signatureParameters = new SortedDictionary<string, string>(
                StringComparer.Ordinal)
            {
                ["folder"] = folder,
                ["timestamp"] = timestamp
            };

            var signature = CreateSignature(signatureParameters);
            using var content = new MultipartFormDataContent();
            using var fileContent = new StreamContent(imageStream);

            fileContent.Headers.ContentType =
                new MediaTypeHeaderValue("application/octet-stream");

            content.Add(fileContent, "file", Path.GetFileName(fileName));
            content.Add(new StringContent(_settings.ApiKey), "api_key");
            content.Add(new StringContent(timestamp), "timestamp");
            content.Add(new StringContent(folder), "folder");
            content.Add(new StringContent(signature), "signature");

            var endpoint =
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(_settings.CloudName)}/image/upload";

            using var response = await _httpClient.PostAsync(
                endpoint, content, cancellationToken);

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Cloudinary image upload failed ({(int)response.StatusCode}).");
            }

            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;

            var secureUrl = root.GetProperty("secure_url").GetString();
            var publicId = root.GetProperty("public_id").GetString();

            if (string.IsNullOrWhiteSpace(secureUrl) ||
                string.IsNullOrWhiteSpace(publicId))
            {
                throw new InvalidOperationException(
                    "Cloudinary returned an incomplete image response.");
            }

            return new CloudinaryUploadResult(secureUrl, publicId);
        }

        public async Task DeleteImageAsync(
            string publicId,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            if (string.IsNullOrWhiteSpace(publicId))
            {
                return;
            }

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                .ToString(CultureInfo.InvariantCulture);

            var signatureParameters = new SortedDictionary<string, string>(
                StringComparer.Ordinal)
            {
                ["public_id"] = publicId,
                ["timestamp"] = timestamp
            };

            using var content = new FormUrlEncodedContent(
                new Dictionary<string, string>
                {
                    ["public_id"] = publicId,
                    ["timestamp"] = timestamp,
                    ["api_key"] = _settings.ApiKey,
                    ["signature"] = CreateSignature(signatureParameters)
                });

            var endpoint =
                $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(_settings.CloudName)}/image/destroy";

            using var response = await _httpClient.PostAsync(
                endpoint, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Cloudinary image deletion failed ({(int)response.StatusCode}).");
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            using var document = JsonDocument.Parse(responseBody);

            if (document.RootElement.TryGetProperty("result", out var result) &&
                result.GetString() is not ("ok" or "not found"))
            {
                throw new InvalidOperationException(
                    "Cloudinary did not confirm image deletion.");
            }
        }

        private string CreateSignature(
            SortedDictionary<string, string> parameters)
        {
            var parameterString = string.Join(
                "&",
                parameters.Select(pair => $"{pair.Key}={pair.Value}"));

            var payload = Encoding.UTF8.GetBytes(
                parameterString + _settings.ApiSecret);

            var hash = SHA1.HashData(payload);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private void ValidateConfiguration()
        {
            if (string.IsNullOrWhiteSpace(_settings.CloudName) ||
                string.IsNullOrWhiteSpace(_settings.ApiKey) ||
                string.IsNullOrWhiteSpace(_settings.ApiSecret))
            {
                throw new InvalidOperationException(
                    "Cloudinary is not configured. Set Cloudinary:CloudName, Cloudinary:ApiKey and Cloudinary:ApiSecret.");
            }
        }
    }
}
