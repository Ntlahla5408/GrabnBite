import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import CustomerBottomNav from "../components/CustomerBottomNav";
import { useAuth } from "../context/authContext";
import {
    getCart,
    removeCartItem,
    updateCartItem,
} from "../services/cartService";
import { Cart } from "../types/cart";

export default function CartScreen() {
  const { token } = useAuth();

  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    loadCart();
  }, [token]);

  async function loadCart() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getCart(token);

      setCarts(data);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setError("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }

  async function changeQuantity(
    cartItemId: number,
    currentQuantity: number,
    newQuantity: number,
  ) {
    if (!token || newQuantity < 1) {
      return;
    }

    try {
      setUpdatingItemId(cartItemId);

      await updateCartItem(cartItemId, newQuantity, token);

      await loadCart();
    } catch (error) {
      console.error("Failed to update cart item:", error);
      setError("Unable to update the item.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemoveItem(cartItemId: number) {
    if (!token) {
      return;
    }

    try {
      setUpdatingItemId(cartItemId);

      await removeCartItem(cartItemId, token);

      await loadCart();
    } catch (error) {
      console.error("Failed to remove cart item:", error);
      setError("Unable to remove the item.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#F97316" />

        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>Your Cart</Text>

            <Text style={styles.headerSubtitle}>
              Review your items before checkout
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {carts.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartIcon}>🛒</Text>

            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>

            <Text style={styles.emptyCartText}>
              Add some delicious food from a restaurant to get started.
            </Text>

            <Pressable
              style={styles.browseButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </Pressable>
          </View>
        ) : (
          carts.map((cart) => (
            <View key={cart.cartId} style={styles.restaurantSection}>
              {/* Restaurant heading */}
              <View style={styles.restaurantHeader}>
                <View style={styles.restaurantIcon}>
                  <Text style={styles.restaurantEmoji}>🍔</Text>
                </View>

                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>
                    {cart.restaurantName}
                  </Text>

                  <Text style={styles.itemCount}>
                    {cart.items.length}{" "}
                    {cart.items.length === 1 ? "item" : "items"}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.itemsContainer}>
                {cart.items.map((item) => {
                  const isUpdating = updatingItemId === item.cartItemId;

                  return (
                    <View key={item.cartItemId} style={styles.cartItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.menuItemName}</Text>

                        <Text style={styles.itemPrice}>
                          R{item.unitPrice.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.itemActions}>
                        <View
                          style={[
                            styles.quantityControl,
                            isUpdating && styles.quantityControlDisabled,
                          ]}
                        >
                          <Pressable
                            style={styles.quantityButton}
                            disabled={isUpdating}
                            onPress={() => {
                              if (item.quantity === 1) {
                                handleRemoveItem(item.cartItemId);
                              } else {
                                changeQuantity(
                                  item.cartItemId,
                                  item.quantity,
                                  item.quantity - 1,
                                );
                              }
                            }}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </Pressable>

                          <Text style={styles.quantityText}>
                            {isUpdating ? "..." : item.quantity}
                          </Text>

                          <Pressable
                            style={styles.quantityButton}
                            disabled={isUpdating}
                            onPress={() =>
                              changeQuantity(
                                item.cartItemId,
                                item.quantity,
                                item.quantity + 1,
                              )
                            }
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </Pressable>
                        </View>

                        <Text style={styles.itemSubtotal}>
                          R{item.subtotal.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Restaurant total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Restaurant subtotal</Text>

                <Text style={styles.totalAmount}>
                  R{cart.totalAmount.toFixed(2)}
                </Text>
              </View>

              {/* Checkout */}
              <Pressable
                style={styles.checkoutButton}
                onPress={() =>
                  router.push({
                    pathname: "/checkout",
                    params: {
                      cartId: cart.cartId.toString(),
                      restaurantId: cart.restaurantId.toString(),
                    },
                  })
                }
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>

                <Text style={styles.checkoutAmount}>
                  R{cart.totalAmount.toFixed(2)}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
      <CustomerBottomNav />
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
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
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

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 3,
  },

  content: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    color: "#B91C1C",
    fontSize: 14,
  },

  restaurantSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    overflow: "hidden",
  },

  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  restaurantEmoji: {
    fontSize: 24,
  },

  restaurantInfo: {
    flex: 1,
  },

  restaurantName: {
    color: "#172033",
    fontSize: 19,
    fontWeight: "800",
  },

  itemCount: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  itemsContainer: {
    paddingHorizontal: 18,
  },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  itemPrice: {
    color: "#64748B",
    fontSize: 13,
  },

  itemActions: {
    alignItems: "flex-end",
  },

  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 9,
    overflow: "hidden",
    marginBottom: 7,
  },

  quantityControlDisabled: {
    opacity: 0.5,
  },

  quantityButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  quantityButtonText: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "700",
  },

  quantityText: {
    minWidth: 34,
    textAlign: "center",
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
  },

  itemSubtotal: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },

  totalLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  totalAmount: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
  },

  checkoutButton: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#F97316",
    borderRadius: 11,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  checkoutAmount: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 90,
  },

  emptyCartIcon: {
    fontSize: 55,
    marginBottom: 16,
  },

  emptyCartTitle: {
    color: "#172033",
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyCartText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 420,
    marginBottom: 22,
  },

  browseButton: {
    backgroundColor: "#F97316",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },

  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
