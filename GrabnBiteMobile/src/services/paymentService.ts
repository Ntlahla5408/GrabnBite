
import { apiRequest } from "./api";

export interface YocoPaymentResponse {
  redirectUrl?: string;
  paymentId: number;
  orderId: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string | null;
  transactionReference: string | null;
  paymentDate: string;
  yocoCheckoutId: string;
}

export async function createYocoPayment(
  orderId: number,
  token: string
): Promise<YocoPaymentResponse> {
  return apiRequest(
    `/api/Payment/yoco/${orderId}`,
    {
      method: "POST",
    },
    token
  );
}

export interface YocoPaymentConfirmation {
  message: string;
  orderId: number;
  paymentId?: number;
  paymentStatus: string;
  orderStatus?: string;
}

export async function confirmYocoPayment(
  orderId: number,
  token: string
): Promise<YocoPaymentConfirmation> {
  return apiRequest(
    `/api/Payment/yoco/${orderId}/confirm`,
    { method: "POST" },
    token
  );
}
