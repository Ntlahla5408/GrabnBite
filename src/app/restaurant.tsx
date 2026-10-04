import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../context/authContext";

import { addCartItem, getCart } from "../services/cartService";
import { getRestaurantMenu } from "../services/menuService";
import { getRestaurant } from "../services/restaurantService";

import { Cart } from "../types/cart";
import { MenuItem } from "../types/menu";
import { Restaurant } from "../types/restaurant";

export default function RestaurantScreen() {
  const { token } = useAuth();

  const [cart, setCart] = useState<Cart[]>([]);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState("");

  const params = useLocalSearchParams<{
    restaurantId?: string;
  }>();

  const restaurantId = Number(params.restaurantId);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) {
      setError("Restaurant could not be found.");
      setLoading(false);
      return;
    }

    loadRestaurant();
  }, [restaurantId]);

  async function loadRestaurant() {
    try {
      setLoading(true);
      setError("");

      const [restaurantData, menuData] = await Promise.all([
        getRestaurant(restaurantId),
        getRestaurantMenu(restaurantId),
      ]);

      setRestaurant(restaurantData);
      setMenuItems(menuData.filter((item) => item.isAvailable));
    } catch (err) {
      console.error("Failed to load restaurant:", err);
      setError("Unable to load restaurant. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const categoryIds = Array.from(
      new Set(menuItems.map((item) => item.menuCategoryId)),
    );

    return categoryIds;
  }, [menuItems]);

  function getCategoryName(categoryId: number) {
    switch (categoryId) {
      case 1:
        return "Burgers";

      case 2:
        return "Meals";

      case 3:
        return "Drinks";

      default:
        return "Menu";
    }
  }

  async function handleAddToCart(menuItemId: number) {
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAddingItemId(menuItemId);
      setCartMessage("");

      await addCartItem(
        {
          menuItemId,
          quantity: 1,
        },
        token,
      );

      const updatedCart = await getCart(token);

      setCart(updatedCart);
      setCartMessage("Item added to cart.");
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      setCartMessage("Unable to add item to cart.");
    } finally {
      setAddingItemId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#F97316" />

        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorTitle}>Something went wrong</Text>

        <Text style={styles.errorText}>{error || "Restaurant not found."}</Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const cartTotal = cart.reduce(
    (total, currentCart) => total + currentCart.totalAmount,
    0,
  );

  return (
    <View style={styles.container}>
      {/* Restaurant Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backIconButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          {restaurant.imageUrl ? (
            <Image
              source={{ uri: restaurant.imageUrl }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.restaurantImagePlaceholder}>
              <Text style={styles.restaurantEmoji}>🍽️</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>

            <Text style={styles.restaurantDescription} numberOfLines={2}>
              {restaurant.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: restaurant.isOpen
                        ? "#4ADE80"
                        : "#F87171",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.metaText,
                    restaurant.isOpen ? styles.openText : styles.closedText,
                  ]}
                >
                  {restaurant.isOpen ? "Open" : "Closed"}
                </Text>
              </View>

              {restaurant.isOpen && (
                <>
                  <Text style={styles.metaDivider}>•</Text>

                  <Text style={styles.metaText}>20–35 min</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Menu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>

          <Text style={styles.menuSubtitle}>Choose something delicious</Text>
        </View>

        {cartMessage !== "" && (
          <View style={styles.cartMessageContainer}>
            <Text style={styles.cartMessage}>{cartMessage}</Text>
          </View>
        )}

        {categories.map((categoryId) => {
          const categoryItems = menuItems.filter(
            (item) => item.menuCategoryId === categoryId,
          );

          return (
            <View key={categoryId} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryName(categoryId)}
              </Text>

              {categoryItems.map((item) => (
                <View key={item.menuItemId} style={styles.menuCard}>
                  <View style={styles.menuInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <Text style={styles.itemPrice}>
                      R{item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.addButtonPressed,
                      addingItemId === item.menuItemId &&
                        styles.addButtonDisabled,
                    ]}
                    disabled={addingItemId === item.menuItemId}
                    onPress={() => handleAddToCart(item.menuItemId)}
                  >
                    <Text style={styles.addButtonText}>
                      {addingItemId === item.menuItemId ? "…" : "+"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}

        {menuItems.length === 0 && (
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyMenuIcon}>🍽️</Text>

            <Text style={styles.emptyMenuTitle}>No menu items available</Text>

            <Text style={styles.emptyMenuText}>
              This restaurant currently has no available items.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cart Bar */}
      <View style={styles.cartBar}>
        <Pressable
          style={({ pressed }) => [
            styles.cartButton,
            pressed && styles.cartButtonPressed,
          ]}
          onPress={() => router.push("/cart")}
        >
          <View>
            <Text style={styles.cartButtonLabel}>YOUR CART</Text>

            <Text style={styles.cartButtonText}>View Cart</Text>
          </View>

          <Text style={styles.cartAmount}>R{cartTotal.toFixed(2)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071B2C",
  },

  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#071B2C",
  },

  loadingText: {
    marginTop: 12,
    color: "#AFC0CC",
    fontSize: 14,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  errorText: {
    color: "#AFC0CC",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#18384D",
  },

  headerContent: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },

  backIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  restaurantImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#18384D",
    marginRight: 14,
  },

  restaurantImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  restaurantEmoji: {
    fontSize: 30,
  },

  headerInfo: {
    flex: 1,
  },

  restaurantName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },

  restaurantDescription: {
    color: "#AFC0CC",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  metaText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },

  metaDivider: {
    color: "#526A7A",
    marginHorizontal: 8,
  },

  openText: {
    color: "#4ADE80",
  },

  closedText: {
    color: "#F87171",
  },

  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 125,
  },

  menuHeader: {
    marginBottom: 24,
  },

  menuTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  menuSubtitle: {
    color: "#AFC0CC",
    fontSize: 13,
    marginTop: 4,
  },

  cartMessageContainer: {
    backgroundColor: "rgba(74, 222, 128, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.20)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },

  cartMessage: {
    color: "#4ADE80",
    fontSize: 13,
    fontWeight: "600",
  },

  categorySection: {
    marginBottom: 26,
  },

  categoryTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: "#0D2638",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#18384D",
    flexDirection: "row",
    alignItems: "center",
  },

  menuInfo: {
    flex: 1,
    paddingRight: 15,
  },

  itemName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  itemDescription: {
    color: "#AFC0CC",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },

  itemPrice: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },

  addButtonDisabled: {
    opacity: 0.6,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "500",
    lineHeight: 30,
  },

  emptyMenu: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D2638",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 45,
    borderWidth: 1,
    borderColor: "#18384D",
  },

  emptyMenuIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyMenuTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  emptyMenuText: {
    fontSize: 13,
    color: "#AFC0CC",
    textAlign: "center",
    lineHeight: 19,
  },

  cartBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#071B2C",
    borderTopWidth: 1,
    borderTopColor: "#18384D",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },

  cartButton: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    backgroundColor: "#F97316",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cartButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  cartButtonLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },

  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  cartAmount: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});
