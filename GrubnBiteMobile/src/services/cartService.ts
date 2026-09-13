import { apiRequest } from "./api";
import { getCurrentUser } from "./sessionService";

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

export const getCarts = async (userId: number): Promise<Cart[]> => {
  const response = await apiRequest<Cart[] | Cart | LegacyEmptyCartResponse>(
    `/api/Cart/${userId}`,
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
  userId: number,
  menuItemId: number,
  quantity = 1,
): Promise<void> => {
  await apiRequest(`/api/Cart/${userId}/items`, {
    method: "POST",
    body: JSON.stringify({ menuItemId, quantity }),
  });
};

export const updateCartItem = async (
  userId: number,
  cartItemId: number,
  quantity: number,
): Promise<void> => {
  await apiRequest(`/api/Cart/${userId}/items/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
};

export const removeCartItem = async (
  userId: number,
  cartItemId: number,
): Promise<void> => {
  await apiRequest(`/api/Cart/${userId}/items/${cartItemId}`, {
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
  const userId = getCurrentUser()?.userId;

  if (!userId) {
    throw new Error("Please sign in before checking out.");
  }

  return await apiRequest(`/api/Checkout/${userId}`, {
    method: "POST",
    body: JSON.stringify({ cartId, deliveryAddressId }),
  });
};
