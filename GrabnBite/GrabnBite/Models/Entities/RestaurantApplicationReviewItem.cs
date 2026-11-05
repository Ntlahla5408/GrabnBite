namespace GrabnBite.Models.Entities
{
    public class RestaurantApplicationReviewItem
    {
        public int RestaurantApplicationReviewItemId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public RestaurantReviewCategory ReviewCategory { get; set; }

        public RestaurantVerificationStatus VerificationStatus { get; set; }
            = RestaurantVerificationStatus.Pending;

        public int? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? AdminComment { get; set; }

        public RestaurantApplication RestaurantApplication { get; set; } = null!;
        public User? ReviewedByUser { get; set; }
    }
}
