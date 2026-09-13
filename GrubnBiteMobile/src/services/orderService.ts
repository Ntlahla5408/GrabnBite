import { apiRequest } from "./api";
import { getCurrentUser } from "./sessionService";

export interface OrderItem {
  id?: number;
  menuItemId?: number;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  menuItem?: {
    id: number;
    name: string;
    description?: string;
    price?: number;
  };
}

export interface Order {
  id: number;

  restaurantId?: number;
  deliveryAddressId?: number;
  deliveryId?: number;

  status?: string;

  totalAmount?: number;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;

  createdAt?: string;
  updatedAt?: string;

  restaurant?: {
    id: number;
    name: string;
    address?: string;
  };

  deliveryAddress?: {
    id: number;
    label?: string;
    streetAddress?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };

  orderItems?: OrderItem[];
  items?: OrderItem[];

  delivery?: {
    id: number;
    status?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
}

export interface OrderStatusHistory {
  id?: number;
  orderId?: number;
  status?: string;
  createdAt?: string;
  timestamp?: string;
}

interface OrderResponse {
  orderId?: number;
  id?: number;
  orderDate?: string;
  createdAt?: string;
  status?: string;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  restaurantId?: number;
  deliveryAddressId?: number;
  deliveryId?: number;
  userId?: number;
  orderItems?: Array<{
    orderItemId?: number;
    id?: number;
    menuItemId?: number;
    menuItemName?: string;
    quantity: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
}

const getUserId = (): number => {
  const userId = getCurrentUser()?.userId;
  if (!userId) {
    throw new Error("Please sign in to view your orders.");
  }
  return userId;
};

const normalizeOrder = (response: OrderResponse): Order => ({
  id: Number(response.orderId ?? response.id ?? 0),
  restaurantId: response.restaurantId,
  deliveryAddressId: response.deliveryAddressId,
  deliveryId: response.deliveryId,
  status: response.status,
  totalAmount: response.totalAmount,
  total: response.total,
  subtotal: response.subtotal,
  deliveryFee: response.deliveryFee,
  createdAt: response.orderDate ?? response.createdAt,
  orderItems: (response.orderItems ?? []).map((item) => ({
    id: item.orderItemId ?? item.id,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.subtotal,
    menuItem: item.menuItemName
      ? {
          id: item.menuItemId ?? 0,
          name: item.menuItemName,
          price: item.unitPrice,
        }
      : undefined,
  })),
});

export const getMyOrders = async (): Promise<Order[]> => {
  const userId = getUserId();
  const response = await apiRequest<OrderResponse[]>(
    `/api/Order/${userId}/my-orders`,
  );
  return response.map(normalizeOrder);
};

export const getOrder = async (id: number): Promise<Order> => {
  const userId = getUserId();
  const response = await apiRequest<OrderResponse>(
    `/api/Order/${userId}/${id}`,
  );
  return normalizeOrder(response);
};

export const getOrderStatusHistory = async (
  id: number,
): Promise<OrderStatusHistory[]> => {
  const userId = getUserId();
  const response = await apiRequest<
    Array<{
      orderStatusHistoryId?: number;
      id?: number;
      status?: string;
      changedAt?: string;
      timestamp?: string;
    }>
  >(`/api/Order/${userId}/${id}/status-history`);

  return response.map((item) => ({
    id: item.orderStatusHistoryId ?? item.id,
    orderId: id,
    status: item.status,
    createdAt: item.changedAt ?? item.timestamp,
    timestamp: item.changedAt ?? item.timestamp,
  }));
};
