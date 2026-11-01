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
