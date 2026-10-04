export interface CartItem {
  cartItemId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  restaurantId: number;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
}

export interface AddCartItemDto {
  menuItemId: number;
  quantity: number;
}
