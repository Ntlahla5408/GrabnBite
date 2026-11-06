using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using GrabnBite.Configuration;
using GrabnBite.Models.Entities;
using Microsoft.Extensions.Options;

namespace GrabnBite.Services
{
    public interface IEmailVerificationService
    {
        string GenerateCode();
        string HashCode(int userId, string code);
        bool VerifyCode(int userId, string code, string expectedHash);
        Task SendVerificationCodeAsync(User user, string code, CancellationToken cancellationToken = default);
        Task SendEmailChangeCodeAsync(User user, string targetEmail, string code, CancellationToken cancellationToken = default);
    }

    public sealed class EmailVerificationService : IEmailVerificationService
    {
        private readonly IBrevoEmailService brevoEmailService;
        private readonly EmailVerificationSettings settings;

        public EmailVerificationService(IBrevoEmailService brevoEmailService, IOptions<EmailVerificationSettings> settings)
        {
            this.brevoEmailService = brevoEmailService;
            this.settings = settings.Value;
        }

        public string GenerateCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        public string HashCode(int userId, string code)
        {
            var key = GetPepper();
            var payload = Encoding.UTF8.GetBytes($"{userId}:{code}");
            var hash = HMACSHA256.HashData(key, payload);
            return Convert.ToBase64String(hash);
        }

        public bool VerifyCode(int userId, string code, string expectedHash)
        {
            if (string.IsNullOrWhiteSpace(expectedHash)) return false;
            byte[] expectedBytes;
            try { expectedBytes = Convert.FromBase64String(expectedHash); }
            catch (FormatException) { return false; }
            var actualBytes = Convert.FromBase64String(HashCode(userId, code));
            return expectedBytes.Length == actualBytes.Length &&
                CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
        }

        public Task SendVerificationCodeAsync(User user, string code, CancellationToken cancellationToken = default)
        {
            var firstName = HtmlEncoder.Default.Encode(user.FirstName);
            var html = $"""
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#071B2C">
                  <h2 style="color:#F97316">Verify your GrabnBite email</h2>
                  <p>Hello {firstName},</p>
                  <p>Use the verification code below to confirm your email address:</p>
                  <p style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#FFF7ED;display:inline-block;border-radius:10px">{code}</p>
                  <p>This code expires in {settings.CodeLifetimeMinutes} minutes.</p>
                  <p>If you did not create a GrabnBite account, you can ignore this email.</p>
                </div>
                """;
            var text = $"Hello {user.FirstName}, your GrabnBite email verification code is {code}. It expires in {settings.CodeLifetimeMinutes} minutes. If you did not create an account, ignore this email.";
            return brevoEmailService.SendTransactionalEmailAsync(user.Email, "Verify your GrabnBite email", html, text, cancellationToken);
        }

        public Task SendEmailChangeCodeAsync(User user, string targetEmail, string code, CancellationToken cancellationToken = default)
        {
            var firstName = HtmlEncoder.Default.Encode(user.FirstName);
            var html = $"""
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#071B2C">
                  <h2 style="color:#F97316">Confirm your new GrabnBite email</h2>
                  <p>Hello {firstName},</p>
                  <p>Use this code to confirm the new email address for your GrabnBite account:</p>
                  <p style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#FFF7ED;display:inline-block;border-radius:10px">{code}</p>
                  <p>This code expires in {settings.CodeLifetimeMinutes} minutes. Your current email remains unchanged until verification succeeds.</p>
                  <p>If you did not request this change, you can ignore this message.</p>
                </div>
                """;
            var text = $"Hello {user.FirstName}, your GrabnBite email-change code is {code}. It expires in {settings.CodeLifetimeMinutes} minutes. Your current email remains unchanged until verification succeeds.";
            return brevoEmailService.SendTransactionalEmailAsync(targetEmail, "Confirm your new GrabnBite email", html, text, cancellationToken);
        }

        private byte[] GetPepper()
        {
            if (string.IsNullOrWhiteSpace(settings.OtpPepper))
                throw new InvalidOperationException("EmailVerification:OtpPepper is not configured.");
            byte[] key;
            try { key = Convert.FromBase64String(settings.OtpPepper); }
            catch (FormatException exception)
            {
                throw new InvalidOperationException("EmailVerification:OtpPepper must be a base64-encoded 32-byte key.", exception);
            }
            if (key.Length != 32)
                throw new InvalidOperationException("EmailVerification:OtpPepper must decode to exactly 32 bytes.");
            return key;
        }
    }
}