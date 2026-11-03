namespace GrabnBite.Models.Entities
{
    public class RestaurantAgreementAcceptance
    {
        public int RestaurantAgreementAcceptanceId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public string SignatoryFullName { get; set; } = string.Empty;
        public string SignatoryPosition { get; set; } = string.Empty;
        public string SignatoryEmail { get; set; } = string.Empty;
        public string SignatoryMobileNumber { get; set; } = string.Empty;
        public string? ElectronicSignatureReference { get; set; }

        // Record successful OTP verification; never store the OTP itself.
        public DateTime OtpVerifiedAt { get; set; }
        public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        public RestaurantApplication RestaurantApplication { get; set; } = null!;

        public ICollection<RestaurantAgreementAcceptanceDocument> Documents { get; set; }
            = new List<RestaurantAgreementAcceptanceDocument>();
    }
}
