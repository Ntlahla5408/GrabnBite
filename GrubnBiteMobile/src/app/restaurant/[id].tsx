import { getMenuItemImage, getRestaurantImage } from "@/constants/assetImages";
import { FoodColors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { apiRequest } from "@/services/api";
import { Restaurant, getRestaurant } from "@/services/restaurantService";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId: number;
}

interface MenuItemResponse {
  menuItemId?: number;
  id?: number;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId?: number;
}

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, carts, removeItem, setItemQuantity } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadRestaurant();
    }
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      setError("");

      const restaurantId = Number(id);
      if (Number.isNaN(restaurantId)) {
        throw new Error("Invalid restaurant ID.");
      }

      const [restaurantData, menuData] = await Promise.all([
        getRestaurant(restaurantId),
        apiRequest<MenuItemResponse[]>(
          `/api/MenuItem/restaurant/${restaurantId}`,
        ),
      ]);

      setRestaurant(restaurantData);
      setMenuItems(
        Array.isArray(menuData)
          ? menuData.map((menuItem) => ({
              id: Number(menuItem.menuItemId ?? menuItem.id ?? 0),
              name: menuItem.name,
              description: menuItem.description ?? "",
              price: Number(menuItem.price),
              isAvailable: menuItem.isAvailable,
              menuCategoryId: Number(menuItem.menuCategoryId ?? 0),
            }))
          : [],
      );
    } catch (err) {
      console.error("Restaurant details error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load restaurant.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: MenuItem) => {
    try {
      setUpdatingItemId(item.id);
      await addItem(item.id);
    } catch (err) {
      Alert.alert(
        "Could not add item",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const getCartItem = (menuItemId: number) =>
    carts
      .flatMap((cart) => cart.items)
      .find((cartItem) => cartItem.menuItemId === menuItemId);

  const changeItemQuantity = async (item: MenuItem, increase: boolean) => {
    const cartItem = getCartItem(item.id);

    try {
      setUpdatingItemId(item.id);

      if (!cartItem) {
        await addItem(item.id);
      } else if (increase) {
        await setItemQuantity(cartItem.cartItemId, cartItem.quantity + 1);
      } else if (cartItem.quantity <= 1) {
        await removeItem(cartItem.cartItemId);
      } else {
        await setItemQuantity(cartItem.cartItemId, cartItem.quantity - 1);
      }
    } catch (err) {
      Alert.alert(
        "Could not update cart",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={FoodColors.tomato} />

        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error !== "" || !restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Couldn't load restaurant</Text>
        <Text style={styles.errorMessage}>
          {error || "Restaurant not found."}
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backIconButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Hero */}
        <View style={styles.hero}>
          {restaurant.imageUrl ? (
            <Image
              source={{ uri: restaurant.imageUrl }}
              contentFit="cover"
              transition={250}
              style={styles.heroImage}
            />
          ) : (
            <Image
              source={getRestaurantImage(restaurant.name)}
              contentFit="cover"
              transition={250}
              style={styles.heroImage}
            />
          )}

          <View
            style={[
              styles.statusBadge,
              restaurant.isOpen ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
            </Text>
          </View>
        </View>

        {/* Restaurant Information */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.description}>
            {restaurant.description || "Delicious food made for you."}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{restaurant.address}</Text>
          </View>

          {!!restaurant.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoText}>{restaurant.phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          <Text style={styles.menuSubtitle}>Choose something delicious</Text>
        </View>

        {/* Empty Menu */}
        {menuItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No menu items yet</Text>
            <Text style={styles.emptySubtitle}>
              This restaurant hasn't added any menu items yet.
            </Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.menuCard,
                !item.isAvailable && styles.menuCardUnavailable,
              ]}
            >
              <View style={styles.menuImageContainer}>
                <Image
                  source={getMenuItemImage(item.name, restaurant.name)}
                  contentFit="cover"
                  style={styles.menuItemImage}
                />

                {item.isAvailable &&
                  (() => {
                    const cartItem = getCartItem(item.id);
                    const quantity = cartItem?.quantity ?? 0;
                    const isUpdating = updatingItemId === item.id;

                    return quantity === 0 ? (
                      <Pressable
                        accessibilityLabel={`Add ${item.name} to cart`}
                        style={styles.addButton}
                        onPress={() => handleAddItem(item)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </Pressable>
                    ) : (
                      <View
                        style={[
                          styles.quantityControl,
                          isUpdating && styles.quantityControlDisabled,
                        ]}
                      >
                        <Pressable
                          accessibilityLabel={`Decrease ${item.name} quantity`}
                          style={styles.quantityButton}
                          onPress={() => changeItemQuantity(item, false)}
                          disabled={isUpdating}
                        >
                          <Text style={styles.quantityButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <Pressable
                          accessibilityLabel={`Increase ${item.name} quantity`}
                          style={styles.quantityButton}
                          onPress={() => changeItemQuantity(item, true)}
                          disabled={isUpdating}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </Pressable>
                      </View>
                    );
                  })()}
              </View>

              <View style={styles.menuItemContent}>
                <Text
                  style={[
                    styles.menuItemName,
                    !item.isAvailable && styles.unavailableText,
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={styles.menuItemDescription} numberOfLines={2}>
                  {item.description ||
                    "A delicious choice from the restaurant."}
                </Text>
                <Text style={styles.price}>
                  R{Number(item.price).toFixed(2)}
                </Text>
                {!item.isAvailable && (
                  <Text style={styles.unavailableLabel}>
                    Currently unavailable
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FoodColors.oat,
  },

  header: {
    height: 62,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    color: FoodColors.ink,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  hero: {
    height: 190,
    backgroundColor: FoodColors.cream,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  heroEmoji: {
    fontSize: 75,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  heroFallbackText: {
    color: FoodColors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  statusBadge: {
    position: "absolute",
    top: 14,
    left: 16,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  openBadge: {
    backgroundColor: FoodColors.green,
  },

  closedBadge: {
    backgroundColor: FoodColors.tomatoDark,
  },

  statusText: {
    color: FoodColors.onDark,
    fontSize: 10,
    fontWeight: "800",
  },

  restaurantInfo: {
    backgroundColor: FoodColors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },

  restaurantName: {
    fontSize: 24,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  description: {
    fontSize: 14,
    color: FoodColors.muted,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoIcon: {
    fontSize: 14,
    width: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: FoodColors.muted,
  },

  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },

  menuTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  menuSubtitle: {
    fontSize: 13,
    color: FoodColors.muted,
    marginTop: 3,
  },

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  menuCard: {
    width: "48%",
    marginBottom: 12,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FoodColors.line,
    overflow: "hidden",
  },

  menuCardUnavailable: {
    opacity: 0.55,
  },

  menuImageContainer: {
    width: "100%",
    aspectRatio: 1.15,
    position: "relative",
    backgroundColor: FoodColors.oat,
  },

  menuItemImage: {
    width: "100%",
    height: "100%",
  },

  menuItemContent: {
    padding: 12,
  },

  menuItemName: {
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  unavailableText: {
    color: FoodColors.muted,
  },

  menuItemDescription: {
    fontSize: 13,
    color: FoodColors.muted,
    lineHeight: 18,
    marginTop: 5,
  },

  price: {
    fontSize: 15,
    fontWeight: "800",
    color: FoodColors.tomato,
    marginTop: 8,
  },

  unavailableLabel: {
    fontSize: 11,
    color: FoodColors.tomatoDark,
    fontWeight: "600",
    marginTop: 5,
  },

  addButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: FoodColors.onDark,
    fontSize: 27,
    fontWeight: "500",
    lineHeight: 29,
  },

  quantityControl: {
    position: "absolute",
    right: 10,
    bottom: 10,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    backgroundColor: FoodColors.tomato,
    overflow: "hidden",
  },

  quantityControlDisabled: {
    opacity: 0.6,
  },

  quantityButton: {
    width: 34,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    color: FoodColors.onDark,
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 24,
  },

  quantityText: {
    minWidth: 18,
    color: FoodColors.onDark,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyContainer: {
    marginHorizontal: 20,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    padding: 30,

    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 13,
    color: FoodColors.muted,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F7F9FC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#69717D",
  },

  errorIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222831",
    textAlign: "center",
  },

  errorMessage: {
    fontSize: 13,
    color: "#69717D",
    textAlign: "center",
    marginTop: 7,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: "#208AEF",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 9,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
