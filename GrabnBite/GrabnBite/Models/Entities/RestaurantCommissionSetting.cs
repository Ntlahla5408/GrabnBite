namespace GrabnBite.Models.Entities
{
    public class RestaurantCommissionSetting
    {
        public int RestaurantCommissionSettingId { get; set; }
        public int RestaurantId { get; set; }
        public DateTime ActivationDate { get; set; }
        public DateOnly PromotionStartDate { get; set; }

        // Exclusive: standard commission starts on this date.
        public DateOnly PromotionEndDateExclusive { get; set; }

        public decimal PromotionCommissionRate { get; set; } = 0.0000m;
        public decimal CollectionCommissionRate { get; set; } = 0.0800m;
        public decimal RestaurantDeliveryCommissionRate { get; set; } = 0.1000m;
        public decimal GrubnBiteDeliveryCommissionRate { get; set; } = 0.1500m;
        public bool IsPromotionActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Restaurant Restaurant { get; set; } = null!;
    }
}
