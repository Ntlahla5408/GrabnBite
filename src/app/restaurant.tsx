import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getCart, addCartItem } from "../services/cartService";
import { Cart } from "../types/cart";

import { useAuth } from "../context/authContext";

import { getRestaurantMenu } from "../services/menuService";
import { getRestaurant } from "../services/restaurantService";

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
      token
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
  (total, currentCart) =>
    total + currentCart.totalAmount,
  0
);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backIconButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.restaurantIcon}>
            <Text style={styles.restaurantEmoji}>🍔</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>

            <Text style={styles.restaurantDescription}>
              {restaurant.description}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>★ 4.6</Text>

              <Text style={styles.metaDivider}>•</Text>

              <Text style={styles.metaText}>20–35 min</Text>

              <Text style={styles.metaDivider}>•</Text>

              <Text
                style={[
                  styles.metaText,
                  restaurant.isOpen ? styles.openText : styles.closedText,
                ]}
              >
                {restaurant.isOpen ? "Open" : "Closed"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.menuTitle}>Menu</Text>
        {cartMessage !== "" && (
          <Text style={styles.cartMessage}>{cartMessage}</Text>
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
                    <Text style={styles.itemName}>{item.name}</Text>

                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>

                    <Text style={styles.itemPrice}>
                      R{item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.addButton,
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
            <Text style={styles.emptyMenuTitle}>No menu items available</Text>

            <Text style={styles.emptyMenuText}>
              This restaurant currently has no available items.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cart bar */}
      <View style={styles.cartBar}>
        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.cartButtonText}>View Cart</Text>

          <Text style={styles.cartAmount}>R{cartTotal.toFixed(2)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 8,
  },

  errorText: {
    color: "#64748B",
    fontSize: 15,
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
    paddingTop: 22,
    paddingBottom: 24,
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
    backgroundColor: "rgba(255,255,255,0.12)",
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

  restaurantIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
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
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },

  restaurantDescription: {
    color: "#CBD5E1",
    fontSize: 13,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  metaDivider: {
    color: "#64748B",
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
    paddingBottom: 120,
  },

  menuTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 24,
  },

  categorySection: {
    marginBottom: 26,
  },

  categoryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },

  menuInfo: {
    flex: 1,
    paddingRight: 15,
  },

  itemName: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
  },

  itemDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
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

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "500",
    lineHeight: 30,
  },

  emptyMenu: {
    alignItems: "center",
    paddingVertical: 50,
  },

  emptyMenuTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 6,
  },

  emptyMenuText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  cartBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  cartButton: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  cartAmount: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  cartMessage: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
});
