import { ApiError, apiRequest } from "./api";
import { getCurrentUser } from "./sessionService";

export interface Restaurant {
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

interface RestaurantResponse {
  restaurantId?: number;
  id?: number;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
}

const normalizeRestaurant = (
  restaurant: RestaurantResponse,
): Restaurant => ({
  id: restaurant.restaurantId ?? restaurant.id ?? 0,
  name: restaurant.name,
  description: restaurant.description ?? "",
  phoneNumber: restaurant.phoneNumber ?? "",
  email: restaurant.email ?? "",
  address: restaurant.address ?? "",
  latitude: restaurant.latitude ?? 0,
  longitude: restaurant.longitude ?? 0,
  isOpen: restaurant.isOpen ?? false,
});

export interface CreateRestaurantRequest {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface UpdateRestaurantRequest {
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

export interface CreateMenuCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateMenuCategoryRequest {
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
  restaurantId?: number;
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

export interface AdminUser {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

// -----------------------------
// RESTAURANTS
// -----------------------------

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const restaurants = await apiRequest<RestaurantResponse[]>("/api/Restaurant");
  return restaurants.map(normalizeRestaurant);
};

export const createRestaurant = async (
  data: CreateRestaurantRequest,
): Promise<Restaurant> => {
  const userId = getCurrentUser()?.userId;
  if (!userId) {
    throw new Error("Your session could not be identified.");
  }

  const restaurant = await apiRequest<RestaurantResponse>(
    `/api/Restaurant/user/${userId}`,
    {
    method: "POST",
    body: JSON.stringify(data),
    },
  );
  return normalizeRestaurant(restaurant);
};

export const updateRestaurant = async (
  id: number,
  data: UpdateRestaurantRequest,
): Promise<Restaurant> => {
  const userId = getCurrentUser()?.userId;
  if (!userId) {
    throw new Error("Your session could not be identified.");
  }

  const restaurant = await apiRequest<RestaurantResponse>(
    `/api/Restaurant/user/${userId}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  return normalizeRestaurant(restaurant);
};

export const updateRestaurantAsAdmin = async (
  id: number,
  data: UpdateRestaurantRequest,
): Promise<Restaurant> => {
  try {
    const restaurant = await apiRequest<RestaurantResponse>(
      `/api/Restaurant/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    return normalizeRestaurant(restaurant);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error(
        "The admin restaurant API is unavailable. Restart the backend API and try again.",
      );
    }

    if (error instanceof ApiError && error.status === 401) {
      throw new Error(
        "Your admin session has expired. Please sign in again and retry.",
      );
    }

    throw error;
  }
};

export const deleteRestaurant = async (id: number): Promise<void> => {
  const userId = getCurrentUser()?.userId;
  if (!userId) {
    throw new Error("Your session could not be identified.");
  }

  await apiRequest<void>(`/api/Restaurant/user/${userId}/${id}`, {
    method: "DELETE",
  });
};

// -----------------------------
// MENU CATEGORIES
// -----------------------------

export const getMenuCategories = async (): Promise<MenuCategory[]> => {
  return await apiRequest<MenuCategory[]>("/api/MenuCategory");
};

export const createMenuCategory = async (
  data: CreateMenuCategoryRequest,
): Promise<MenuCategory> => {
  return await apiRequest<MenuCategory>("/api/MenuCategory", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateMenuCategory = async (
  id: number,
  data: UpdateMenuCategoryRequest,
): Promise<MenuCategory> => {
  return await apiRequest<MenuCategory>(`/api/MenuCategory/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteMenuCategory = async (id: number): Promise<void> => {
  await apiRequest<void>(`/api/MenuCategory/${id}`, {
    method: "DELETE",
  });
};

// -----------------------------
// MENU ITEMS
// -----------------------------

export const getMenuItems = async (): Promise<MenuItem[]> => {
  return await apiRequest<MenuItem[]>("/api/MenuItem");
};

export const getMenuItemsByRestaurant = async (
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

export const deleteMenuItem = async (id: number): Promise<void> => {
  await apiRequest<void>(`/api/MenuItem/${id}`, {
    method: "DELETE",
  });
};

// -----------------------------
// ADMIN AUTH CHECK
// -----------------------------

export const adminTest = async (): Promise<unknown> => {
  return await apiRequest<unknown>("/api/Authentication/admin-test");
};

export const getUsers = async (): Promise<AdminUser[]> => {
  const endpoints = ["/api/User", "/api/Users", "/api/Admin/users"];

  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const users = await apiRequest<AdminUser[]>(endpoint);
      return users.map((user) => ({
        ...user,
        id: user.userId ?? user.id,
        isActive: user.isActive ?? true,
      }));
    } catch (error) {
      lastError = error;
      if (
        !(error instanceof Error && "status" in error && error.status === 404)
      ) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("The API does not expose a user-management endpoint.");
};

export const updateUserRole = async (
  userId: number,
  data: UpdateUserRoleRequest,
): Promise<AdminUser> => {
  const user = await apiRequest<AdminUser>(`/api/Users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return { ...user, id: user.userId ?? user.id, isActive: user.isActive ?? true };
};

export const updateUserStatus = async (
  userId: number,
  data: UpdateUserStatusRequest,
): Promise<AdminUser> => {
  const user = await apiRequest<AdminUser>(`/api/Users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return { ...user, id: user.userId ?? user.id, isActive: user.isActive ?? true };
};

export const deleteUser = async (userId: number): Promise<void> => {
  await apiRequest<void>(`/api/Users/${userId}`, {
    method: "DELETE",
  });
};
