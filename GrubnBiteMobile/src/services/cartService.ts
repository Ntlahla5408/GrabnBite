import { apiRequest } from "./api";
import { getToken } from "./sessionService";

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

export interface AddCartItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

const CART_ENDPOINT = "/api/Cart";
const CART_ITEMS_ENDPOINT = "/api/Cart/items";

export const getCart = async (): Promise<Cart> => {
  const response = await apiRequest<unknown>(CART_ENDPOINT, {
    token: getToken(),
  });
  const payload = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const rawItems = Array.isArray(response)
    ? response
    : payload.items ?? payload.cartItems ?? (payload.data as Record<string, unknown> | undefined)?.items;

  const items = Array.isArray(rawItems) ? rawItems : [];

  return {
    id: Number(payload.cartId ?? payload.id ?? 0),
    items: items.map((rawItem) => {
      const item = rawItem as Record<string, unknown>;
      const menuItem = item.menuItem as Record<string, unknown> | undefined;

      return {
      id: Number(item.cartItemId ?? item.id ?? 0),
      menuItemId: Number(item.menuItemId ?? menuItem?.id ?? 0),
      quantity: Number(item.quantity ?? 0),
      menuItem: {
        name: String(item.menuItemName ?? item.name ?? menuItem?.name ?? "Menu item"),
        price: Number(item.unitPrice ?? item.price ?? menuItem?.price ?? 0),
      },
      };
    }),
  };
};

export const addCartItem = async (
  data: AddCartItemRequest,
): Promise<void> => {
  await apiRequest<void>(CART_ITEMS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
    token: getToken(),
  });
};

export const updateCartItem = async (
  id: number,
  data: UpdateCartItemRequest,
): Promise<void> => {
  await apiRequest<void>(`${CART_ITEMS_ENDPOINT}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token: getToken(),
  });
};

export const removeCartItem = async (
  id: number,
): Promise<void> => {
  await apiRequest<void>(`${CART_ITEMS_ENDPOINT}/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
};

export const clearCart = async (): Promise<void> => {
  await apiRequest<void>(CART_ENDPOINT, {
    method: "DELETE",
    token: getToken(),
  });
};