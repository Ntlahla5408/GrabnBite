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
