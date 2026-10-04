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
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
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
            <View style={styles.emptyCartIconContainer}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
            </View>

            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>

            <Text style={styles.emptyCartText}>
              Add some delicious food from a restaurant to get started.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.browseButton,
                pressed && styles.browseButtonPressed,
              ]}
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
                  <Text style={styles.restaurantEmoji}>🍽️</Text>
                </View>

                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
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
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.menuItemName}
                        </Text>

                        <Text style={styles.itemPrice}>
                          R{item.unitPrice.toFixed(2)} each
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
                            style={({ pressed }) => [
                              styles.quantityButton,
                              pressed && styles.quantityButtonPressed,
                            ]}
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
                            style={({ pressed }) => [
                              styles.quantityButton,
                              pressed && styles.quantityButtonPressed,
                            ]}
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
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.checkoutButtonPressed,
                ]}
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
                <View>
                  <Text style={styles.checkoutLabel}>READY TO ORDER?</Text>

                  <Text style={styles.checkoutButtonText}>
                    Proceed to Checkout
                  </Text>
                </View>

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
    backgroundColor: "#071B2C",
  },

  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071B2C",
  },

  loadingText: {
    marginTop: 12,
    color: "#AFC0CC",
    fontSize: 14,
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

  backButton: {
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

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#AFC0CC",
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
    backgroundColor: "rgba(248, 113, 113, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
  },

  restaurantSection: {
    backgroundColor: "#0D2638",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#18384D",
    marginBottom: 20,
    overflow: "hidden",
  },

  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#18384D",
  },

  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#18384D",
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
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  itemCount: {
    color: "#7F94A3",
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
    borderBottomColor: "#18384D",
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  itemPrice: {
    color: "#7F94A3",
    fontSize: 12,
  },

  itemActions: {
    alignItems: "flex-end",
  },

  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#315067",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 7,
    backgroundColor: "#071B2C",
  },

  quantityControlDisabled: {
    opacity: 0.5,
  },

  quantityButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D2638",
  },

  quantityButtonPressed: {
    backgroundColor: "#18384D",
  },

  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  quantityText: {
    minWidth: 34,
    textAlign: "center",
    color: "#FFFFFF",
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
    color: "#AFC0CC",
    fontSize: 14,
    fontWeight: "600",
  },

  totalAmount: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  checkoutButton: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#F97316",
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  checkoutButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  checkoutLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  checkoutAmount: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 90,
  },

  emptyCartIconContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyCartIcon: {
    fontSize: 40,
  },

  emptyCartTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyCartText: {
    color: "#AFC0CC",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 420,
    marginBottom: 22,
  },

  browseButton: {
    backgroundColor: "#F97316",
    borderRadius: 11,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },

  browseButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
