import { apiRequest } from "./api";

export interface CartItem {
  id: number;
  menuItemId: number;
  quantity: number;
  menuItem?: {
    name: string;
    price: number;
  };
}

export interface Cart {
  id: number;
  items: CartItem[];
}

interface CartResponseItem {
  cartItemId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
}

interface CartResponse {
  cartId?: number;
  items?: CartResponseItem[];
}

export interface AddCartItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const getCart = async (): Promise<Cart> => {
  const response = await apiRequest<CartResponse>("/api/Cart");

  return {
    id: response.cartId ?? 0,
    items: (response.items ?? []).map((item) => ({
      id: item.cartItemId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      menuItem: {
        name: item.menuItemName,
        price: item.unitPrice,
      },
    })),
  };
};

export const addCartItem = async (
  data: AddCartItemRequest,
): Promise<void> => {
  await apiRequest<void>("/api/Cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateCartItem = async (
  id: number,
  data: UpdateCartItemRequest,
): Promise<void> => {
  await apiRequest<void>(`/api/Cart/items/${id}`, {
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