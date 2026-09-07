namespace GrabnBite.Models.Entities
{
    public class Review
    {
        public int ReviewId { get; set; }

        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }

        public int RestaurantId { get; set; }

        public int OrderId { get; set; }

        public User User { get; set; } = null!;

        public Restaurant Restaurant { get; set; } = null!;

        public Order Order { get; set; } = null!;
    }
}