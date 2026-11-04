using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace GrabnBite.Services
{
    public interface IRestaurantBankingEncryptionService
    {
        string Encrypt(string plaintext);
        string Decrypt(string ciphertext);
    }

    public sealed class RestaurantBankingEncryptionService : IRestaurantBankingEncryptionService
    {
        private readonly IConfiguration _configuration;

        public RestaurantBankingEncryptionService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string Encrypt(string plaintext)
        {
            if (string.IsNullOrWhiteSpace(plaintext))
                throw new ArgumentException("A bank account number is required.", nameof(plaintext));

            var key = GetKey();
            var nonce = RandomNumberGenerator.GetBytes(12);
            var plaintextBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);
            var ciphertext = new byte[plaintextBytes.Length];
            var tag = new byte[16];

            using (var aes = new AesGcm(key, tag.Length))
            {
                aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);
            }

            // Versioned payload: v1.<nonce>.<tag>.<ciphertext>
            return string.Join(
                ".",
                "v1",
                Convert.ToBase64String(nonce),
                Convert.ToBase64String(tag),
                Convert.ToBase64String(ciphertext));
        }

        public string Decrypt(string encryptedValue)
        {
            if (string.IsNullOrWhiteSpace(encryptedValue))
                throw new ArgumentException("An encrypted account number is required.", nameof(encryptedValue));

            var parts = encryptedValue.Split('.');
            if (parts.Length != 4 || parts[0] != "v1")
                throw new CryptographicException("The encrypted banking value has an unsupported format.");

            var nonce = Convert.FromBase64String(parts[1]);
            var tag = Convert.FromBase64String(parts[2]);
            var ciphertext = Convert.FromBase64String(parts[3]);
            var plaintext = new byte[ciphertext.Length];

            using (var aes = new AesGcm(GetKey(), tag.Length))
            {
                aes.Decrypt(nonce, ciphertext, tag, plaintext);
            }

            return System.Text.Encoding.UTF8.GetString(plaintext);
        }

        private byte[] GetKey()
        {
            var configuredKey = _configuration["RestaurantBankingEncryption:Key"];
            if (string.IsNullOrWhiteSpace(configuredKey))
                throw new InvalidOperationException(
                    "Restaurant banking encryption is not configured. Set RestaurantBankingEncryption:Key to a base64-encoded 32-byte key.");

            byte[] key;
            try
            {
                key = Convert.FromBase64String(configuredKey);
            }
            catch (FormatException exception)
            {
                throw new InvalidOperationException(
                    "RestaurantBankingEncryption:Key must be valid base64.",
                    exception);
            }

            if (key.Length != 32)
                throw new InvalidOperationException(
                    "RestaurantBankingEncryption:Key must decode to exactly 32 bytes.");

            return key;
        }
    }
}
