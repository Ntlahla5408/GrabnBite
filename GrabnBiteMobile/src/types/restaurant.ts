export interface Restaurant {
  restaurantId: number;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  isApproved: boolean;
  createdAt: string;
}
