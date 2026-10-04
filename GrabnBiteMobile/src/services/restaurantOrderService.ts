import { apiRequest } from "./api";

export interface RestaurantOrderItem {
  orderItemId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface RestaurantOrder {
  orderId: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  userId: number;
  deliveryAddressId: number;
  items: RestaurantOrderItem[];
  statusHistory: {
    status: string;
    changedAt: string;
  }[];
}

export async function getRestaurantOrders(
  token: string
): Promise<RestaurantOrder[]> {
  return apiRequest(
    "/api/RestaurantOrders",
    {},
    token
  );
}

export async function acceptRestaurantOrder(
  orderId: number,
  token: string
) {
  return apiRequest(
    `/api/RestaurantOrders/${orderId}/accept`,
    {
      method: "PATCH",
    },
    token
  );
}

export async function prepareRestaurantOrder(
  orderId: number,
  token: string
) {
  return apiRequest(
    `/api/RestaurantOrders/${orderId}/prepare`,
    {
      method: "PATCH",
    },
    token
  );
}

export async function readyRestaurantOrder(
  orderId: number,
  token: string
) {
  return apiRequest(
    `/api/RestaurantOrders/${orderId}/ready`,
    {
      method: "PATCH",
    },
    token
  );
}