import { apiRequest } from "./api";

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

interface LegacyEmptyCartResponse {
  items?: CartItem[];
  totalAmount?: number;
}

const normalizeCart = (cart: Cart): Cart => ({
  ...cart,
  items: cart.items ?? [],
  totalAmount: Number(cart.totalAmount ?? 0),
});

export const getCarts = async (): Promise<Cart[]> => {
  const response = await apiRequest<Cart[] | Cart | LegacyEmptyCartResponse>(
    "/api/Cart",
  );

  if (Array.isArray(response)) {
    return response.map(normalizeCart);
  }

  if ("cartId" in response) {
    return [normalizeCart(response)];
  }

  return [];
};

export const addCartItem = async (
  menuItemId: number,
  quantity = 1,
): Promise<void> => {
  await apiRequest("/api/Cart/items", {
    method: "POST",
    body: JSON.stringify({ menuItemId, quantity }),
  });
};

export const updateCartItem = async (
  cartItemId: number,
  quantity: number,
): Promise<void> => {
  await apiRequest(`/api/Cart/items/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
};

export const removeCartItem = async (cartItemId: number): Promise<void> => {
  await apiRequest(`/api/Cart/items/${cartItemId}`, {
    method: "DELETE",
  });
};

export const checkoutCart = async (
  cartId: number,
  deliveryAddressId: number,
): Promise<{
  orderId: number;
  userId: number;
  restaurantId: number;
  deliveryAddressId: number;
  totalAmount: number;
  status: string;
}> => {
  return await apiRequest("/api/Checkout", {
    method: "POST",
    body: JSON.stringify({ cartId, deliveryAddressId }),
  });
};
