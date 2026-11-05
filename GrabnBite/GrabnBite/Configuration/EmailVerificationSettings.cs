namespace GrabnBite.Configuration
{
    public sealed class EmailVerificationSettings
    {
        public string OtpPepper { get; set; } = string.Empty;

        public int CodeLifetimeMinutes { get; set; } = 10;

        public int ResendCooldownSeconds { get; set; } = 60;

        public int MaxFailedAttempts { get; set; } = 5;

        public int MaxResendsPerHour { get; set; } = 5;
    }
}