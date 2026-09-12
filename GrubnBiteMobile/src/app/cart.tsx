import {
    Cart,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
    Cart,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "@/services/cartService";
import { isLoggedIn } from "@/services/sessionService";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function CartScreen() {
  const scheme = useColorScheme();
  const colors = useMemo(
    () => getCartColors(scheme ?? "light"),
    [scheme],
  );

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();
      setCart(data);
    } catch (caughtError) {
      console.error("Cart error:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load cart.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const changeQuantity = async (
    itemId: number,
    quantity: number,
  ) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      setUpdating(true);
      await updateCartItem(itemId, { quantity });
      await loadCart();
    } catch (caughtError) {
      console.error("Quantity update error:", caughtError);
      Alert.alert(
        "Unable to update",
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      setUpdating(true);
      await removeCartItem(itemId);
      await loadCart();
    } catch (caughtError) {
      console.error("Remove cart item error:", caughtError);
      Alert.alert(
        "Unable to remove item",
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setUpdating(true);
      await clearCart();
      await loadCart();
    } catch (caughtError) {
      console.error("Clear cart error:", caughtError);
      Alert.alert(
        "Unable to clear cart",
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const items = cart?.items ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = item.menuItem?.price ?? 0;
        return total + price * item.quantity;
      }, 0),
    [items],
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}> 
          Loading your cart...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Couldn't load your cart
        </Text>

        <Text style={[styles.errorText, { color: colors.textSecondary }]}> 
          {error}
        </Text>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={() => void loadCart()}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Cart</Text>

        <View style={styles.headerSpacer} />
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
          <Text style={styles.emptyEmoji}>🛒</Text>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>

          <Text style={[styles.emptyText, { color: colors.textSecondary }]}> 
            Add some delicious food and it will appear here.
          </Text>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>Browse Restaurants</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.restaurantSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Items</Text>

              <Pressable onPress={() => void handleClearCart()} disabled={updating}>
                <Text style={[styles.clearText, { color: colors.error }]}>Clear cart</Text>
              </Pressable>
            </View>

            {items.map((item) => {
              const name = item.menuItem?.name ?? `Menu Item #${item.menuItemId}`;
              const price = item.menuItem?.price ?? 0;

              return (
                <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                  <View style={[styles.foodPlaceholder, { backgroundColor: colors.imageBackground }]}> 
                    <Text style={styles.foodEmoji}>🍽️</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.itemPrice, { color: colors.accent }]}>
                      R{price.toFixed(2)}
                    </Text>

                    <View style={styles.quantityRow}>
                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: colors.button }]}
                        onPress={() => void changeQuantity(item.id, item.quantity - 1)}
                        disabled={updating}
                      >
                        <Text style={[styles.quantityButtonText, { color: colors.accent }]}>−</Text>
                      </Pressable>

                      <Text style={[styles.quantity, { color: colors.text }]}>{item.quantity}</Text>

                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: colors.button }]}
                        onPress={() => void changeQuantity(item.id, item.quantity + 1)}
                        disabled={updating}
                      >
                        <Text style={[styles.quantityButtonText, { color: colors.accent }]}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.itemTotal, { color: colors.text }]}>
                    R{(price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.summary, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>R{subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>Calculated at checkout</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>R{subtotal.toFixed(2)}</Text>
            </View>

            <Pressable
              style={[styles.checkoutButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutButtonText}>Continue to Checkout</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function getCartColors(scheme: ColorSchemeName | "light" | "dark") {
  const isDark = scheme === "dark";

  return {
    background: isDark ? "#11151c" : "#f8f9fc",
    surface: isDark ? "#141a22" : "#ffffff",
    card: isDark ? "#1c222b" : "#ffffff",
    border: isDark ? "#303846" : "#dce3ee",
    text: isDark ? "#eef5f2" : "#222831",
    textSecondary: isDark ? "#aeb4bf" : "#69717d",
    accent: isDark ? "#ff8a65" : "#208AEF",
    button: isDark ? "#252b35" : "#eaf4ff",
    imageBackground: isDark ? "#232a34" : "#eaf4ff",
    error: isDark ? "#ff9a9a" : "#d64545",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 62,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 34,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  restaurantSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  clearText: {
    fontSize: 13,
    fontWeight: "700",
  },

  cartItem: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  foodPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  foodEmoji: {
    fontSize: 30,
  },

  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "700",
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },

  quantity: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },

  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
  },

  summary: {
    borderTopWidth: 1,
    padding: 20,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 13,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: 5,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
  },

  totalValue: {
    fontSize: 19,
    fontWeight: "800",
  },

  checkoutButton: {
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyEmoji: {
    fontSize: 55,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 350,
  },

  primaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
  },
});