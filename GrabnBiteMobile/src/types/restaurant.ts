export interface Restaurant {
  restaurantId: number;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  location: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  isApproved: boolean;
  averagePreparationTimeMinutes: number | null;
  createdAt: string;
}
