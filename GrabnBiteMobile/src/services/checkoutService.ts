import { apiRequest } from "./api";

export interface CreateCheckoutDto {
  cartId: number;
  deliveryAddressId: number;
  paymentMethod: "YOCO" | "CASH";
}

export interface CheckoutResult {
  orderId: number;
  message?: string;
}

export async function createCheckout(
  data: CreateCheckoutDto,
  token: string
): Promise<CheckoutResult> {
  return apiRequest(
    "/api/Checkout",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}