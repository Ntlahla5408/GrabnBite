namespace GrabnBite.Models.Entities
{
    public class Cart
    {
        public int CartID { get; set; }
        public string UserID { get; set; }
        public decimal ResturantID { get; set; }
        // Foreign Keys
        public int CreatedAt { get; set; }
        public int UpdatedAt { get; set; }
    }
}
