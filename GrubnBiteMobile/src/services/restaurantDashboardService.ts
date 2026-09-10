import { apiRequest } from "./api";
import { Order } from "./orderService";

export interface UpdateRestaurantOrderStatusRequest {
  status: string;
}

export const getRestaurantOrders = async (
  restaurantId: number,
): Promise<Order[]> => {
  return await apiRequest<Order[]>(
    `/api/Order/restaurant/${restaurantId}`,
  );
};

export const updateRestaurantOrderStatus = async (
  orderId: number,
  status: string,
): Promise<Order> => {
  return await apiRequest<Order>(
    `/api/Order/${orderId}/restaurant-status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      } satisfies UpdateRestaurantOrderStatusRequest),
    },
  );
};