import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
  Cart,
} from "@/services/cartService";
import { router } from "expo-router";
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

export default function CartScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();

      setCart(data);
    } catch (error) {
      console.error("Cart error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load cart.",
      );
    } finally {
      setLoading(false);
    }
  };

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

      const updatedItem = await updateCartItem(itemId, {
        quantity,
      });

      setCart((currentCart) => {
        if (!currentCart) return currentCart;

        return {
          ...currentCart,
          items: currentCart.items.map((item) =>
            item.id === itemId ? updatedItem : item,
          ),
        };
      });
    } catch (error) {
      console.error("Quantity update error:", error);

      Alert.alert(
        "Unable to update",
        error instanceof Error
          ? error.message
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

      setCart((currentCart) => {
        if (!currentCart) return currentCart;

        return {
          ...currentCart,
          items: currentCart.items.filter(
            (item) => item.id !== itemId,
          ),
        };
      });
    } catch (error) {
      console.error("Remove cart item error:", error);

      Alert.alert(
        "Unable to remove item",
        error instanceof Error
          ? error.message
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

      setCart((currentCart) => {
        if (!currentCart) return currentCart;

        return {
          ...currentCart,
          items: [],
        };
      });
    } catch (error) {
      console.error("Clear cart error:", error);

      Alert.alert(
        "Unable to clear cart",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const items = cart?.items ?? [];

  const subtotal = items.reduce((total, item) => {
    const price = item.menuItem?.price ?? 0;

    return total + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.loadingText}>
          Loading your cart...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Couldn't load your cart
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={loadCart}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Your Cart
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>

          <Text style={styles.emptyTitle}>
            Your cart is empty
          </Text>

          <Text style={styles.emptyText}>
            Add some delicious food and it will appear
            here.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>
              Browse Restaurants
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.restaurantSection}>
              <Text style={styles.sectionTitle}>
                Your Items
              </Text>

              <Pressable
                onPress={handleClearCart}
                disabled={updating}
              >
                <Text style={styles.clearText}>
                  Clear cart
                </Text>
              </Pressable>
            </View>

            {items.map((item) => {
              const name =
                item.menuItem?.name ??
                `Menu Item #${item.menuItemId}`;

              const price =
                item.menuItem?.price ?? 0;

              return (
                <View
                  key={item.id}
                  style={styles.cartItem}
                >
                  <View style={styles.foodPlaceholder}>
                    <Text style={styles.foodEmoji}>
                      🍽️
                    </Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>
                      {name}
                    </Text>

                    <Text style={styles.itemPrice}>
                      R{price.toFixed(2)}
                    </Text>

                    <View style={styles.quantityRow}>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() =>
                          changeQuantity(
                            item.id,
                            item.quantity - 1,
                          )
                        }
                        disabled={updating}
                      >
                        <Text style={styles.quantityButtonText}>
                          −
                        </Text>
                      </Pressable>

                      <Text style={styles.quantity}>
                        {item.quantity}
                      </Text>

                      <Pressable
                        style={styles.quantityButton}
                        onPress={() =>
                          changeQuantity(
                            item.id,
                            item.quantity + 1,
                          )
                        }
                        disabled={updating}
                      >
                        <Text style={styles.quantityButtonText}>
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.itemTotal}>
                    R{(price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal
              </Text>

              <Text style={styles.summaryValue}>
                R{subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery
              </Text>

              <Text style={styles.summaryValue}>
                Calculated at checkout
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                R{subtotal.toFixed(2)}
              </Text>
            </View>

            <Pressable
              style={styles.checkoutButton}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutButtonText}>
                Continue to Checkout
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  header: {
    height: 62,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF1",
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
    color: "#222831",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#222831",
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
    color: "#222831",
  },

  clearText: {
    color: "#D64545",
    fontSize: 13,
    fontWeight: "600",
  },

  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E6EC",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  foodPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: "#EAF4FF",
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
    color: "#222831",
  },

  itemPrice: {
    fontSize: 13,
    color: "#208AEF",
    fontWeight: "700",
    marginTop: 4,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    color: "#208AEF",
    fontSize: 19,
    fontWeight: "700",
  },

  quantity: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#222831",
  },

  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222831",
  },

  summary: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E1E6EC",
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
    color: "#69717D",
  },

  summaryValue: {
    fontSize: 13,
    color: "#222831",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#E8ECF1",
    marginVertical: 5,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222831",
  },

  totalValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#208AEF",
  },

  checkoutButton: {
    backgroundColor: "#208AEF",
    borderRadius: 11,
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
    color: "#222831",
    marginTop: 15,
  },

  emptyText: {
    fontSize: 14,
    color: "#69717D",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 350,
  },

  primaryButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
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
    color: "#69717D",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222831",
    textAlign: "center",
  },

  errorText: {
    fontSize: 13,
    color: "#69717D",
    textAlign: "center",
    marginTop: 7,
  },
});