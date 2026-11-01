using Microsoft.AspNetCore.Http;

namespace GrabnBite.Services
{
    public static class ImageUploadValidation
    {
        public const long MaximumFileSize = 5 * 1024 * 1024;

        public static async Task<string?> ValidateAsync(
            IFormFile? file,
            CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
            {
                return "Please select an image.";
            }

            if (file.Length > MaximumFileSize)
            {
                return "The image must be 5 MB or smaller.";
            }

            var contentType = file.ContentType?.ToLowerInvariant();
            if (contentType is not ("image/jpeg" or "image/png" or "image/webp"))
            {
                return "Only JPEG, PNG and WebP images are supported.";
            }

            await using var stream = file.OpenReadStream();
            var header = new byte[12];
            var bytesRead = await stream.ReadAsync(
                header.AsMemory(0, header.Length), cancellationToken);

            var isJpeg = bytesRead >= 3 &&
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF;

            var isPng = bytesRead >= 8 &&
                header[0] == 0x89 &&
                header[1] == 0x50 &&
                header[2] == 0x4E &&
                header[3] == 0x47 &&
                header[4] == 0x0D &&
                header[5] == 0x0A &&
                header[6] == 0x1A &&
                header[7] == 0x0A;

            var isWebp = bytesRead >= 12 &&
                header[0] == (byte)'R' &&
                header[1] == (byte)'I' &&
                header[2] == (byte)'F' &&
                header[3] == (byte)'F' &&
                header[8] == (byte)'W' &&
                header[9] == (byte)'E' &&
                header[10] == (byte)'B' &&
                header[11] == (byte)'P';

            var signatureMatchesContentType =
                (contentType == "image/jpeg" && isJpeg) ||
                (contentType == "image/png" && isPng) ||
                (contentType == "image/webp" && isWebp);

            return signatureMatchesContentType
                ? null
                : "The selected file is not a valid JPEG, PNG or WebP image.";
        }
    }
}