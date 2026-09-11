import { apiRequest } from "./api";

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

export const getMyOrders = async (): Promise<Order[]> => {
  return await apiRequest<Order[]>("/api/Order/my-orders");
};

export const getOrder = async (id: number): Promise<Order> => {
  return await apiRequest<Order>(`/api/Order/${id}`);
};

export const getOrderStatusHistory = async (
  id: number,
): Promise<OrderStatusHistory[]> => {
  return await apiRequest<OrderStatusHistory[]>(
    `/api/Order/${id}/status-history`,
  );
};