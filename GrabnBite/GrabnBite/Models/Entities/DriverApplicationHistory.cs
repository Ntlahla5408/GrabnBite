namespace GrabnBite.Models.Entities
{
    public class DriverApplicationHistory
    {
        public int DriverApplicationHistoryId { get; set; }
        public int DriverApplicationId { get; set; }
        public DriverApplicationStatus? PreviousStatus { get; set; }
        public DriverApplicationStatus? NewStatus { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Comment { get; set; }
        public int? PerformedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DriverApplication DriverApplication { get; set; } = null!;
        public User? PerformedByUser { get; set; }
    }
}