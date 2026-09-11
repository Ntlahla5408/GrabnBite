import { apiRequest } from "./api";

export interface AdminRestaurant {
  id: number;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export interface MenuCategory {
  id: number;
  name: string;
  description: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId: number;
  menuCategory?: MenuCategory;
}

export interface RestaurantOrderItem {
  id?: number;
  menuItemId: number;
  quantity: number;
  price?: number;
  unitPrice?: number;
  menuItem?: {
    id: number;
    name: string;
    price?: number;
  };
}

export interface RestaurantOrder {
  id: number;
  restaurantId?: number;
  deliveryAddressId?: number;
  status?: string;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  createdAt?: string;
  orderDate?: string;

  deliveryAddress?: {
    id: number;
    label?: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
  };

  orderItems?: RestaurantOrderItem[];
  items?: RestaurantOrderItem[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId: number;
}

export interface UpdateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
}

/* ---------------- Restaurant ---------------- */

export const getRestaurants =
  async (): Promise<AdminRestaurant[]> => {
    return await apiRequest<AdminRestaurant[]>("/api/Restaurant");
  };

export const getRestaurant = async (
  id: number,
): Promise<AdminRestaurant> => {
  return await apiRequest<AdminRestaurant>(
    `/api/Restaurant/${id}`,
  );
};

export const updateRestaurant = async (
  id: number,
  data: Partial<AdminRestaurant>,
): Promise<AdminRestaurant> => {
  return await apiRequest<AdminRestaurant>(
    `/api/Restaurant/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
};

/* ---------------- Orders ---------------- */

export const getRestaurantOrders = async (
  restaurantId: number,
): Promise<RestaurantOrder[]> => {
  return await apiRequest<RestaurantOrder[]>(
    `/api/Order/restaurant/${restaurantId}`,
  );
};

export const updateRestaurantOrderStatus = async (
  orderId: number,
  status: string,
): Promise<RestaurantOrder> => {
  return await apiRequest<RestaurantOrder>(
    `/api/Order/${orderId}/restaurant-status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
};

/* ---------------- Categories ---------------- */

export const getCategories = async (): Promise<MenuCategory[]> => {
  return await apiRequest<MenuCategory[]>("/api/MenuCategory");
};

export const createCategory = async (
  data: CreateCategoryRequest,
): Promise<MenuCategory> => {
  return await apiRequest<MenuCategory>("/api/MenuCategory", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (
  id: number,
  data: UpdateCategoryRequest,
): Promise<MenuCategory> => {
  return await apiRequest<MenuCategory>(
    `/api/MenuCategory/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
};

export const deleteCategory = async (
  id: number,
): Promise<void> => {
  await apiRequest<void>(`/api/MenuCategory/${id}`, {
    method: "DELETE",
  });
};

/* ---------------- Menu Items ---------------- */

export const getRestaurantMenu = async (
  restaurantId: number,
): Promise<MenuItem[]> => {
  return await apiRequest<MenuItem[]>(
    `/api/MenuItem/restaurant/${restaurantId}`,
  );
};

export const createMenuItem = async (
  data: CreateMenuItemRequest,
): Promise<MenuItem> => {
  return await apiRequest<MenuItem>("/api/MenuItem", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateMenuItem = async (
  id: number,
  data: UpdateMenuItemRequest,
): Promise<MenuItem> => {
  return await apiRequest<MenuItem>(`/api/MenuItem/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteMenuItem = async (
  id: number,
): Promise<void> => {
  await apiRequest<void>(`/api/MenuItem/${id}`, {
    method: "DELETE",
  });
};