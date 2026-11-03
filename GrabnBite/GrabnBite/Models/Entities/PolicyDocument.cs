using System.ComponentModel.DataAnnotations;

namespace GrabnBite.Models.Entities
{
    public class PolicyDocument
    {
        public int PolicyDocumentId { get; set; }

        [MaxLength(180)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public string StoragePath { get; set; } = string.Empty;

        public string OriginalFileName { get; set; } = string.Empty;

        public string ContentType { get; set; } = "application/pdf";

        public long FileSize { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Draft";

        public DateTime? EffectiveDate { get; set; }

        public int Version { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public int CreatedByUserId { get; set; }

        public int? UpdatedByUserId { get; set; }

        public bool IsArchived { get; set; }
    }
}