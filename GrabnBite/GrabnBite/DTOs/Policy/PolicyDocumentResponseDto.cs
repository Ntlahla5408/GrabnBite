namespace GrabnBite.DTOs.Policy
{
    public sealed class PolicyDocumentResponseDto
    {
        public int PolicyDocumentId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string FileUrl { get; set; } = string.Empty;

        public string OriginalFileName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime? EffectiveDate { get; set; }

        public int Version { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}