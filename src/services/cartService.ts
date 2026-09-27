import { AddCartItemDto, Cart } from "../types/cart";
import { apiRequest } from "./api";

export async function getCart(
  token: string
): Promise<Cart[]> {
  return apiRequest(
    "/api/Cart",
    {},
    token
  );
}

export async function addCartItem(
  data: AddCartItemDto,
  token: string,
): Promise<Cart> {
  return apiRequest(
    "/api/Cart/items",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  token: string,
): Promise<Cart> {
  return apiRequest(
    `/api/Cart/items/${cartItemId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        quantity,
      }),
    },
    token,
  );
}

export async function removeCartItem(
  cartItemId: number,
  token: string,
): Promise<Cart> {
  return apiRequest(
    `/api/Cart/items/${cartItemId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function clearCart(token: string): Promise<unknown> {
  return apiRequest(
    "/api/Cart",
    {
      method: "DELETE",
    },
    token,
  );
}
