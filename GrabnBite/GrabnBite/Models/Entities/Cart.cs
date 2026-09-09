namespace GrabnBite.Models.Entities
{
    public class Cart
    {
        public int CartId { get; set; }

        public int UserId { get; set; }
        public int RestaurantId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Restaurant Restaurant { get; set; } = null!;

        public ICollection<CartItem> CartItems { get; set; }
            = new List<CartItem>();
    }
}