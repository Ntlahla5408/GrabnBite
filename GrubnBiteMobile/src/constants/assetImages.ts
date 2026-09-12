import type { ImageSourcePropType } from "react-native";

const restaurantImages = {
  burgerKing: require("@/assets/images/BurgerKing.jpeg"),
  debonairs: require("@/assets/images/Debonaires.jpg"),
  kfc: require("@/assets/images/kfc.jpg"),
  mcdonalds: require("@/assets/images/mcdonalds.jpg"),
  burger: require("@/assets/images/burger.jpg"),
} satisfies Record<string, ImageSourcePropType>;

const menuImages = {
  burger: require("@/assets/images/Classic-Beef-Burger-feature-1200x628-1-760x400.webp"),
  chicken: restaurantImages.kfc,
  pizza: restaurantImages.debonairs,
} satisfies Record<string, ImageSourcePropType>;

export function getRestaurantImage(name: string): ImageSourcePropType {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("burger king")) {
    return restaurantImages.burgerKing;
  }

  if (normalizedName.includes("debonair")) {
    return restaurantImages.debonairs;
  }

  if (normalizedName.includes("kfc")) {
    return restaurantImages.kfc;
  }

  if (normalizedName.includes("mcdonald") || normalizedName.includes("mcdonald's")) {
    return restaurantImages.mcdonalds;
  }

  if (normalizedName.includes("burger")) {
    return restaurantImages.burger;
  }

  return restaurantImages.burger;
}

export function getMenuItemImage(
  itemName: string,
  restaurantName: string,
): ImageSourcePropType {
  const normalizedItemName = itemName.toLowerCase();
  const normalizedRestaurantName = restaurantName.toLowerCase();

  if (normalizedItemName.includes("burger")) {
    return menuImages.burger;
  }

  if (normalizedItemName.includes("pizza") || normalizedRestaurantName.includes("debonair")) {
    return menuImages.pizza;
  }

  if (normalizedItemName.includes("chicken") || normalizedRestaurantName.includes("kfc")) {
    return menuImages.chicken;
  }

  return getRestaurantImage(restaurantName);
}