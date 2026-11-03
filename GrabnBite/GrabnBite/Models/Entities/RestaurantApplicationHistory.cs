namespace GrabnBite.Models.Entities
{
    public class RestaurantApplicationHistory
    {
        public int RestaurantApplicationHistoryId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public RestaurantApplicationStatus? PreviousStatus { get; set; }
        public RestaurantApplicationStatus? NewStatus { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Comment { get; set; }
        public int? PerformedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public RestaurantApplication RestaurantApplication { get; set; } = null!;
        public User? PerformedByUser { get; set; }
    }
}
