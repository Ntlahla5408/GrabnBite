namespace GrabnBite.Models.Entities
{
    public class CartItem
    {
        public int CartItemId { get; set; }


        public decimal CartID { get; set; }

        public int MenuItemId { get; set; }  
        
        public int Quantity { get; set; }     

        public int UnitPrice { get; set; }
    }
}
