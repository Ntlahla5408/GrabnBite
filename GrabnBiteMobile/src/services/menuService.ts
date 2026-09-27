import { apiRequest } from "./api";

export interface MenuItem {
  menuItemId: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  restaurantId: number;
  menuCategoryId: number;
}

export interface MenuCategory {
  menuCategoryId: number;
  name: string;
  description: string;
  restaurantId: number;
}

export interface CreateMenuItem {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId: number;
}

export interface UpdateMenuItem {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
}

export async function getRestaurantMenu(
  restaurantId: number,
): Promise<MenuItem[]> {
  return apiRequest(`/api/MenuItem/restaurant/${restaurantId}`);
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  return apiRequest("/api/MenuCategory");
}

export async function createMenuItem(
  restaurantId: number,
  data: CreateMenuItem,
  token: string,
): Promise<MenuItem> {
  return apiRequest(
    `/api/MenuItem/restaurant/${restaurantId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateMenuItem(
  restaurantId: number,
  menuItemId: number,
  data: UpdateMenuItem,
  token: string,
): Promise<MenuItem> {
  return apiRequest(
    `/api/MenuItem/restaurant/${restaurantId}/${menuItemId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deleteMenuItem(
  restaurantId: number,
  menuItemId: number,
  token: string,
) {
  return apiRequest(
    `/api/MenuItem/restaurant/${restaurantId}/${menuItemId}`,
    {
      method: "DELETE",
    },
    token,
  );
}
