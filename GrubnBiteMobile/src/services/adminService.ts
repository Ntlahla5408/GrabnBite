import { apiRequest } from "./api";

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

// -----------------------------
// RESTAURANTS
// -----------------------------

export const getRestaurants = async (): Promise<Restaurant[]> => {
  return await apiRequest<Restaurant[]>("/api/Restaurant");
};

export const createRestaurant = async (
  data: CreateRestaurantRequest,
): Promise<Restaurant> => {
  return await apiRequest<Restaurant>("/api/Restaurant", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateRestaurant = async (
  id: number,
  data: UpdateRestaurantRequest,
): Promise<Restaurant> => {
  return await apiRequest<Restaurant>(`/api/Restaurant/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteRestaurant = async (id: number): Promise<void> => {
  await apiRequest<void>(`/api/Restaurant/${id}`, {
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