import { apiRequest } from "./api";

export interface CartItem {
  id: number;
  cartId: number;
  menuItemId: number;
  quantity: number;

  // These names may depend on the exact backend response.
  // We will verify them during integration testing.
  menuItem?: {
    id: number;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
  };
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface AddCartItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const getCart = async (): Promise<Cart> => {
  return await apiRequest<Cart>("/api/Cart");
};

export const addCartItem = async (
  data: AddCartItemRequest,
): Promise<CartItem> => {
  return await apiRequest<CartItem>("/api/Cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateCartItem = async (
  id: number,
  data: UpdateCartItemRequest,
): Promise<CartItem> => {
  return await apiRequest<CartItem>(`/api/Cart/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const removeCartItem = async (
  id: number,
): Promise<void> => {
  await apiRequest<void>(`/api/Cart/items/${id}`, {
    method: "DELETE",
  });
};

export const clearCart = async (): Promise<void> => {
  await apiRequest<void>("/api/Cart", {
    method: "DELETE",
  });
};