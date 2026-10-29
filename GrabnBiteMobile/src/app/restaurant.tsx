import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

export default function RestaurantScreen() {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { token, loading: authLoading } = useAuth();

  const [cart, setCart] = useState<Cart[]>([]);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState("");

  const params = useLocalSearchParams<{
    restaurantId?: string;
  }>();

  const restaurantId = Number(params.restaurantId);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [loading, setLoading] = useState(Number.isInteger(restaurantId) && restaurantId > 0);
  const [error, setError] = useState(Number.isInteger(restaurantId) && restaurantId > 0 ? "" : "Restaurant could not be found.");

  const loadRestaurant = useCallback(async () => {
    try {
      const [restaurantData, menuData] = await Promise.all([
        getRestaurant(restaurantId),
        getRestaurantMenu(restaurantId),
      ]);

      setError("");
      setRestaurant(restaurantData);
      setMenuItems(menuData.filter((item) => item.isAvailable));
    } catch (err) {
      console.error("Failed to load restaurant:", err);
      setError("Unable to load restaurant. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (Number.isInteger(restaurantId) && restaurantId > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async restaurant loading; state updates occur after the request resolves.
      void loadRestaurant();
    }
  }, [restaurantId, loadRestaurant]);

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
    if (authLoading) {
      return;
    }

    if (!token) {
      router.replace("/login");
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
      <View style={[styles.centerScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />

        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.centerScreen}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>

        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error || "Restaurant not found."}</Text>

        <Pressable style={[styles.backButton, { backgroundColor: colors.accent }]} onPress={() => router.back()}>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Restaurant Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backIconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
          </Pressable>

          {restaurant.imageUrl ? (
            <Image
              source={{ uri: restaurant.imageUrl }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.restaurantImagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.restaurantEmoji}>🍽️</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={1}>
              {restaurant.name}
            </Text>

            <Text style={[styles.restaurantDescription, { color: colors.textSecondary }]} numberOfLines={2}>
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
                    { color: colors.textSecondary },
                    restaurant.isOpen ? styles.openText : styles.closedText,
                  ]}
                >
                  {restaurant.isOpen ? "Open" : "Closed"}
                </Text>
              </View>

              {restaurant.isOpen && (
                <>
                  <Text style={[styles.metaDivider, { color: colors.textSecondary }]}>•</Text>

                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>20–35 min</Text>
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
          <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>

          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>Choose something delicious</Text>
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
              <Text style={[styles.categoryTitle, { color: colors.accent }]}>
                {getCategoryName(categoryId)}
              </Text>

              {categoryItems.map((item) => (
                <View key={item.menuItemId} style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <Text style={[styles.itemPrice, { color: colors.accent }]}>
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
          <View style={[styles.emptyMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.emptyMenuIcon}>🍽️</Text>

            <Text style={[styles.emptyMenuTitle, { color: colors.text }]}>No menu items available</Text>

            <Text style={[styles.emptyMenuText, { color: colors.textSecondary }]}>
              This restaurant currently has no available items.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cart Bar */}
      <View style={[styles.cartBar, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
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
    backgroundColor: "#F7F9FC",
  },

  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F7F9FC",
  },

  loadingText: {
    marginTop: 12,
    color: "#627487",
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8EF",
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
    borderColor: "#E1E8EF",
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
    color: "#102A43",
    fontSize: 23,
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
    color: "#627487",
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
    color: "#102A43",
    fontSize: 30,
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
    color: "#102A43",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
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
    color: "#102A43",
    fontSize: 17,
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
    color: "#F47721",
    fontSize: 17,
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
    backgroundColor: "#FFFFFF",
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
