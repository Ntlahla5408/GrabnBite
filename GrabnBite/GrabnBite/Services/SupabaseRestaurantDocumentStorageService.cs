using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public interface ISupabaseRestaurantDocumentStorageService
    {
        Task UploadAsync(Stream fileStream, string storagePath, string contentType, CancellationToken cancellationToken = default);
        Task<string> CreateSignedUrlAsync(string storagePath, int expiresInSeconds = 900, CancellationToken cancellationToken = default);
        Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default);
    }

    public sealed class SupabaseRestaurantDocumentStorageService : ISupabaseRestaurantDocumentStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly SupabaseRestaurantDocumentStorageSettings _settings;

        public SupabaseRestaurantDocumentStorageService(
            HttpClient httpClient,
            IOptions<SupabaseRestaurantDocumentStorageSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task UploadAsync(
            Stream fileStream,
            string storagePath,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            var endpoint = $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/{Uri.EscapeDataString(_settings.BucketName)}/{EncodePath(storagePath)}";
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            AddServiceHeaders(request);
            request.Headers.TryAddWithoutValidation("x-upsert", "false");

            request.Content = new StreamContent(fileStream);
            request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

            using var response = await _httpClient.SendAsync(
                request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Restaurant document storage upload failed with HTTP {(int)response.StatusCode}.");
            }
        }

        public async Task<string> CreateSignedUrlAsync(
            string storagePath,
            int expiresInSeconds = 900,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            if (expiresInSeconds < 60 || expiresInSeconds > 3600)
                throw new ArgumentOutOfRangeException(nameof(expiresInSeconds));

            var endpoint = $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/sign/{Uri.EscapeDataString(_settings.BucketName)}/{EncodePath(storagePath)}";
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            AddServiceHeaders(request);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { expiresIn = expiresInSeconds }),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"Restaurant document signed URL creation failed with HTTP {(int)response.StatusCode}.");

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(
                stream, cancellationToken: cancellationToken);

            if (!document.RootElement.TryGetProperty("signedURL", out var signedUrlElement) ||
                string.IsNullOrWhiteSpace(signedUrlElement.GetString()))
                throw new InvalidOperationException("Supabase returned an incomplete signed URL response.");

            var signedUrl = signedUrlElement.GetString()!;
            if (Uri.TryCreate(signedUrl, UriKind.Absolute, out var absoluteUri) &&
                (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
                return signedUrl;

            var relativePath = signedUrl.StartsWith("/", StringComparison.Ordinal)
                ? signedUrl
                : $"/{signedUrl}";

            return $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1{relativePath}";
        }

        public async Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            var endpoint = $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/{Uri.EscapeDataString(_settings.BucketName)}";
            using var request = new HttpRequestMessage(HttpMethod.Delete, endpoint);
            AddServiceHeaders(request);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { prefixes = new[] { storagePath } }),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"Restaurant document storage deletion failed with HTTP {(int)response.StatusCode}.");
        }

        private void AddServiceHeaders(HttpRequestMessage request)
        {
            request.Headers.TryAddWithoutValidation("apikey", _settings.ServiceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ServiceRoleKey);
        }

        private static string EncodePath(string path) =>
            string.Join("/", path.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));

        private void ValidateConfiguration()
        {
            if (!Uri.TryCreate(_settings.ProjectUrl, UriKind.Absolute, out _) ||
                string.IsNullOrWhiteSpace(_settings.ServiceRoleKey) ||
                string.IsNullOrWhiteSpace(_settings.BucketName))
                throw new InvalidOperationException(
                    "Restaurant document storage is not configured. Set SupabaseRestaurantDocumentStorage:ProjectUrl, ServiceRoleKey and BucketName.");
        }
    }
}
