namespace GrabnBite.Models.Entities
{
    public class DriverApplicationDocument
    {
        public int DriverApplicationDocumentId { get; set; }
        public int DriverApplicationId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string? DocumentDescription { get; set; }
        public string StoragePath { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DriverVerificationStatus VerificationStatus { get; set; } = DriverVerificationStatus.Pending;
        public string? AdminComment { get; set; }
        public int? VerifiedByUserId { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? VerifiedAt { get; set; }
        public DriverApplication DriverApplication { get; set; } = null!;
        public User? VerifiedByUser { get; set; }
    }
}