using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GrabnBite.Configuration;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public interface ISupabasePolicyStorageService
    {
        Task<PolicyStorageUploadResult> UploadPdfAsync(
            Stream fileStream,
            string storagePath,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string storagePath,
            CancellationToken cancellationToken = default);
    }

    public sealed record PolicyStorageUploadResult(string StoragePath, string PublicUrl);

    public sealed class SupabasePolicyStorageService : ISupabasePolicyStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly SupabaseStorageSettings _settings;

        public SupabasePolicyStorageService(
            HttpClient httpClient,
            IOptions<SupabaseStorageSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<PolicyStorageUploadResult> UploadPdfAsync(
            Stream fileStream,
            string storagePath,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            var encodedPath = EncodeStoragePath(storagePath);
            var endpoint = $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/{Uri.EscapeDataString(_settings.BucketName)}/{encodedPath}";

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            AddServiceHeaders(request);
            request.Headers.TryAddWithoutValidation("x-upsert", "false");

            var content = new StreamContent(fileStream);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            request.Content = content;

            using var response = await _httpClient.SendAsync(
                request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Supabase PDF upload failed with HTTP {(int)response.StatusCode}.");
            }

            var publicUrl = $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/public/{Uri.EscapeDataString(_settings.BucketName)}/{encodedPath}";
            return new PolicyStorageUploadResult(storagePath, publicUrl);
        }

        public async Task DeleteAsync(
            string storagePath,
            CancellationToken cancellationToken = default)
        {
            ValidateConfiguration();

            using var request = new HttpRequestMessage(
                HttpMethod.Delete,
                $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/{Uri.EscapeDataString(_settings.BucketName)}");

            AddServiceHeaders(request);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { prefixes = new[] { storagePath } }),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Supabase PDF deletion failed with HTTP {(int)response.StatusCode}.");
            }
        }

        private void AddServiceHeaders(HttpRequestMessage request)
        {
            request.Headers.TryAddWithoutValidation("apikey", _settings.ServiceRoleKey);
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", _settings.ServiceRoleKey);
        }

        private static string EncodeStoragePath(string storagePath)
        {
            return string.Join(
                "/",
                storagePath.Split('/', StringSplitOptions.RemoveEmptyEntries)
                    .Select(Uri.EscapeDataString));
        }

        private void ValidateConfiguration()
        {
            if (!Uri.TryCreate(_settings.ProjectUrl, UriKind.Absolute, out _) ||
                string.IsNullOrWhiteSpace(_settings.ServiceRoleKey) ||
                string.IsNullOrWhiteSpace(_settings.BucketName))
            {
                throw new InvalidOperationException(
                    "Supabase Storage is not configured. Set SupabaseStorage:ProjectUrl, SupabaseStorage:ServiceRoleKey and SupabaseStorage:BucketName.");
            }
        }
    }
}