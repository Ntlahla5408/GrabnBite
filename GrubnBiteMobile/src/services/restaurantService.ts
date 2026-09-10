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

export const getRestaurants = async (): Promise<Restaurant[]> => {
  return await apiRequest<Restaurant[]>("/api/Restaurant");
};

export const getRestaurant = async (
  id: number,
): Promise<Restaurant> => {
  return await apiRequest<Restaurant>(`/api/Restaurant/${id}`);
};