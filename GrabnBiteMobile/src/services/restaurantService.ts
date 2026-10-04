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
