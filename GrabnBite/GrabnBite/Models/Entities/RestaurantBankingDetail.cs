namespace GrabnBite.Models.Entities
{
    public class RestaurantBankingDetail
    {
        public int RestaurantBankingDetailId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public string AccountHolderName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;

        // Encrypt before persistence. Never expose the full value through API responses.
        public string AccountNumberEncrypted { get; set; } = string.Empty;

        public string BranchCode { get; set; } = string.Empty;
        public string PayoutContactEmail { get; set; } = string.Empty;

        public RestaurantVerificationStatus VerificationStatus { get; set; }
            = RestaurantVerificationStatus.Pending;

        public int? VerifiedByUserId { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public RestaurantApplication RestaurantApplication { get; set; } = null!;
        public User? VerifiedByUser { get; set; }
    }
}
