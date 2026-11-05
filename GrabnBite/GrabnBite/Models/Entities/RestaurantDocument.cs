namespace GrabnBite.Models.Entities
{
    public class RestaurantDocument
    {
        public int RestaurantDocumentId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public RestaurantDocumentType DocumentType { get; set; }
        public string? DocumentDescription { get; set; }
        public string StoragePath { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }

        public RestaurantVerificationStatus VerificationStatus { get; set; }
            = RestaurantVerificationStatus.Pending;

        public string? AdminComment { get; set; }
        public int? VerifiedByUserId { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? VerifiedAt { get; set; }

        public RestaurantApplication RestaurantApplication { get; set; } = null!;
        public User? VerifiedByUser { get; set; }
    }
}
