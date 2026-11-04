namespace GrabnBite.Models.Entities
{
    public class EmailVerificationChallenge
    {
        public int EmailVerificationChallengeId { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        // HMAC-SHA256 of the six-digit code; the raw code is never persisted.
        public string CodeHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime LastSentAt { get; set; }

        public DateTime ExpiresAt { get; set; }

        public int FailedAttempts { get; set; }

        public int ResendCount { get; set; }

        public DateTime ResendWindowStartedAt { get; set; }
    }
}