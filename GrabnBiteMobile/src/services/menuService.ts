import { apiRequest } from "./api";

export interface MenuItem {
  menuItemId: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
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

export interface CreateMenuCategory {
  name: string;
  description: string;
}

export interface UpdateMenuCategory {
  name: string;
  description: string;
}

export async function createMenuCategory(
  restaurantId: number,
  data: CreateMenuCategory,
  token: string,
): Promise<MenuCategory> {
  return apiRequest(
    `/api/MenuCategory/restaurant/${restaurantId}`,
    { method: "POST", body: JSON.stringify(data) },
    token,
  );
}

export async function updateMenuCategory(
  restaurantId: number,
  categoryId: number,
  data: UpdateMenuCategory,
  token: string,
): Promise<MenuCategory> {
  return apiRequest(
    `/api/MenuCategory/restaurant/${restaurantId}/${categoryId}`,
    { method: "PUT", body: JSON.stringify(data) },
    token,
  );
}

export async function deleteMenuCategory(
  restaurantId: number,
  categoryId: number,
  token: string,
): Promise<void> {
  return apiRequest(
    `/api/MenuCategory/restaurant/${restaurantId}/${categoryId}`,
    { method: "DELETE" },
    token,
  );
}

export async function uploadMenuItemImage(
  restaurantId: number,
  menuItemId: number,
  asset: { uri: string; name: string; type: string },
  token: string,
): Promise<MenuItem> {
  const formData = new FormData();
  formData.append("image", {
    uri: asset.uri,
    name: asset.name,
    type: asset.type,
  } as any);

  return apiRequest(
    `/api/MenuItem/restaurant/${restaurantId}/${menuItemId}/image`,
    { method: "POST", body: formData },
    token,
  );
}

export async function deleteMenuItemImage(
  restaurantId: number,
  menuItemId: number,
  token: string,
): Promise<MenuItem> {
  return apiRequest(
    `/api/MenuItem/restaurant/${restaurantId}/${menuItemId}/image`,
    { method: "DELETE" },
    token,
  );
}
