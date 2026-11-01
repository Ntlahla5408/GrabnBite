using System.ComponentModel.DataAnnotations;

namespace GrabnBite.DTOs.Review
{
    public sealed class CreateReviewDto
    {
        [Range(1, int.MaxValue)]
        public int OrderId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 1)]
        public string Comment { get; set; } = string.Empty;
    }
}
