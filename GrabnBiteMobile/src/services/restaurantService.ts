import { Restaurant } from "../types/restaurant";
import { apiRequest } from "./api";

export async function getRestaurants(): Promise<Restaurant[]> {
  return apiRequest("/api/Restaurant");
}

export async function getRestaurant(restaurantId: number): Promise<Restaurant> {
  return apiRequest(`/api/Restaurant/${restaurantId}`);
}

export async function getMyRestaurant(token: string): Promise<Restaurant> {
  return apiRequest("/api/Restaurant/my-restaurant", {}, token);
}


export interface CreateRestaurantRequest {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
}

export async function createRestaurant(
  restaurant: CreateRestaurantRequest,
  token: string,
): Promise<Restaurant> {
  return apiRequest(
    "/api/Restaurant",
    {
      method: "POST",
      body: JSON.stringify(restaurant),
    },
    token,
  );
}

export interface UpdateRestaurantRequest {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export async function updateMyRestaurant(
  restaurantId: number,
  restaurant: UpdateRestaurantRequest,
  token: string,
): Promise<Restaurant> {
  return apiRequest(
    `/api/Restaurant/${restaurantId}`,
    {
      method: "PUT",
      body: JSON.stringify(restaurant),
    },
    token,
  );
}

export interface ImageUploadAsset {
  uri: string;
  name: string;
  type: string;
}

export async function uploadRestaurantImage(
  restaurantId: number,
  asset: ImageUploadAsset,
  token: string,
): Promise<Restaurant> {
  const formData = new FormData();
  formData.append("image", {
    uri: asset.uri,
    name: asset.name,
    type: asset.type,
  } as any);

  return apiRequest(
    `/api/Restaurant/${restaurantId}/image`,
    { method: "POST", body: formData },
    token,
  );
}

export async function deleteRestaurantImage(
  restaurantId: number,
  token: string,
): Promise<Restaurant> {
  return apiRequest(
    `/api/Restaurant/${restaurantId}/image`,
    { method: "DELETE" },
    token,
  );
}
