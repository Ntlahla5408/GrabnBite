namespace GrabnBite.Models.Entities
{
    public class RestaurantOperatingHour
    {
        public int RestaurantOperatingHourId { get; set; }
        public int RestaurantApplicationId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public TimeOnly? OpeningTime { get; set; }
        public TimeOnly? ClosingTime { get; set; }

        public RestaurantApplication RestaurantApplication { get; set; } = null!;
    }
}
