namespace GrabnBite.DTOs.Checkout
{
    public class CreateCheckoutDto
    {
        public int CartId { get; set; }
        public int DeliveryAddressId { get; set; }
    }
}