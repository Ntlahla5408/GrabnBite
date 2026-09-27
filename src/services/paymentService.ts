import { apiRequest } from "./api";

export interface YocoPaymentResponse {
  redirectUrl: string;
  paymentId: number;
  orderId: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string;
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