import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";

const restaurantImages = {
  burgerKing: require("@/assets/images/BurgerKing.jpeg"),
  debonairs: require("@/assets/images/Debonaires.jpg"),
  kfc: require("@/assets/images/kfc.jpg"),
  mcdonalds: require("@/assets/images/mcdonalds.jpg"),
} satisfies Record<string, ImageSourcePropType>;

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
  categories: string[];
  imageUrl?: string;
  imageSource?: ImageSourcePropType;
}

interface RestaurantResponse {
  id?: number;
  restaurantId?: number;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  cuisineType?: string;
  category?: string;
  type?: string;
  cuisine?: string;
  categories?: string[];
  imageUrl?: string;
  image?: string;
}

function getLocalImageSource(restaurant: RestaurantResponse): ImageSourcePropType | undefined {
  const searchableText = [
    restaurant.name,
    restaurant.description,
    restaurant.cuisineType,
    restaurant.category,
    restaurant.type,
    restaurant.cuisine,
    ...(restaurant.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const compactSearchableText = searchableText.replace(/[^a-z0-9]/g, "");

  if (searchableText.includes("burger king") || compactSearchableText.includes("burgerking")) {
    return restaurantImages.burgerKing;
  }

  if (searchableText.includes("debonair")) {
    return restaurantImages.debonairs;
  }

  if (searchableText.includes("kfc") || searchableText.includes("kentucky fried chicken")) {
    return restaurantImages.kfc;
  }

  if (searchableText.includes("mcdonald")) {
    return restaurantImages.mcdonalds;
  }

  return undefined;
}

const categoryKeywords: Record<string, string[]> = {
  fastfood: ["fast food", "fastfood", "takeaway", "takeout"],
  pizza: ["pizza"],
  wings: ["wing", "wings"],
  burgers: ["burger", "burgers"],
  chicken: ["chicken"],
  breakfast: ["breakfast", "brunch"],
  "ice-cream": ["ice cream", "ice-cream", "gelato"],
  sushi: ["sushi", "japanese"],
  coffee: ["coffee", "cafe", "café"],
  smoothies: ["smoothie", "juice"],
  chinese: ["chinese"],
  desserts: ["dessert", "cake", "bakery", "sweet"],
  indian: ["indian", "curry"],
  italian: ["italian", "pasta"],
  american: ["american"],
  salad: ["salad", "salads"],
  sandwiches: ["sandwich", "sub", "deli"],
  seafood: ["seafood", "fish", "prawn", "shrimp"],
};

const fallbackRestaurants: Restaurant[] = [
  {
    id: 101,
    name: "Burger House",
    description: "Classic smash burgers and hand-cut fries.",
    phoneNumber: "+27112223333",
    email: "orders@burger.local",
    address: "5 Food St",
    latitude: 0,
    longitude: 0,
    isOpen: true,
    categories: ["burgers", "fastfood"],
    imageUrl: undefined,
  },
  {
    id: 102,
    name: "Green Bowl Kitchen",
    description: "Fresh salads, bowls, and health-focused lunches.",
    phoneNumber: "+27112224444",
    email: "hello@greenbowl.local",
    address: "22 Market Lane",
    latitude: 0,
    longitude: 0,
    isOpen: true,
    categories: ["smoothies", "healthy"],
    imageUrl: undefined,
  },
  {
    id: 103,
    name: "Sakura Sushi Bar",
    description: "Fresh sushi rolls, rice bowls, and Japanese classics.",
    phoneNumber: "+27112225555",
    email: "info@sakura.local",
    address: "10 Street East",
    latitude: 0,
    longitude: 0,
    isOpen: true,
    categories: ["sushi", "japanese"],
    imageUrl: undefined,
  },
];

function inferCategories(restaurant: RestaurantResponse): string[] {
  const explicitCategories = [
    restaurant.cuisineType,
    restaurant.category,
    restaurant.type,
    restaurant.cuisine,
    ...(restaurant.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const searchableText = `${restaurant.name} ${restaurant.description ?? ""} ${explicitCategories}`.toLowerCase();

  return Object.entries(categoryKeywords)
    .filter(([, keywords]) =>
      keywords.some((keyword) => searchableText.includes(keyword)),
    )
    .map(([category]) => category);
}

const normalizeRestaurant = (
  restaurant: RestaurantResponse,
): Restaurant => ({
  id: restaurant.id ?? restaurant.restaurantId ?? 0,
  name: restaurant.name,
  description: restaurant.description ?? "",
  phoneNumber: restaurant.phoneNumber ?? "",
  email: restaurant.email ?? "",
  address: restaurant.address ?? "",
  latitude: restaurant.latitude ?? 0,
  longitude: restaurant.longitude ?? 0,
  isOpen: restaurant.isOpen ?? false,
  categories: inferCategories(restaurant),
  imageUrl: restaurant.imageUrl ?? restaurant.image,
  imageSource: getLocalImageSource(restaurant),
});

export const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const data = await apiRequest<RestaurantResponse[]>("/api/Restaurant");
    const restaurants = data.map(normalizeRestaurant);

    if (restaurants.length === 0) {
      return fallbackRestaurants;
    }

    return restaurants;
  } catch (error) {
    console.warn("Restaurant API unavailable, showing fallback restaurants", error);
    return fallbackRestaurants;
  }
};

export const getRestaurant = async (
  id: number,
): Promise<Restaurant> => {
  const data = await apiRequest<RestaurantResponse>(`/api/Restaurant/${id}`);
  return normalizeRestaurant(data);
};