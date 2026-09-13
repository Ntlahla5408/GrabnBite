import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FoodColors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import type { Cart } from "@/services/cartService";

export default function CartScreen() {
  const {
    carts,
    loading,
    refreshing,
    refreshCart,
    restorePendingCheckout,
    setItemQuantity,
    removeItem,
  } = useCart();
  useFocusEffect(
    useCallback(() => {
      const restoreCart = async () => {
        try {
          await refreshCart();
          await restorePendingCheckout();
        } catch {
          // The cart remains available to retry on the next focus.
        }
      };

      restoreCart();
    }, [refreshCart, restorePendingCheckout]),
  );

  const changeQuantity = async (cartItemId: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(cartItemId);
      } else {
        await setItemQuantity(cartItemId, quantity);
      }
    } catch (error) {
      Alert.alert(
        "Could not update cart",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleCheckout = (cart: Cart) => {
    if (!cart.cartId || cart.items.length === 0) {
      return;
    }

    router.push({
      pathname: "/checkout" as never,
      params: { cartId: String(cart.cartId) },
    } as never);
  };

  const activeCarts = carts.filter((cart) => cart.items.length > 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={FoodColors.tomato} />
        <Text style={styles.mutedText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshCart} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR ORDER</Text>
          <Text style={styles.title}>Cart</Text>
          <Text style={styles.subtitle}>
            {activeCarts.length === 0
              ? "Review your items before checkout"
              : `${activeCarts.length} store${activeCarts.length === 1 ? "" : "s"}`}
          </Text>
        </View>
        <Ionicons
          name="bag-handle-outline"
          size={30}
          color={FoodColors.tomato}
        />
      </View>

      {activeCarts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="basket-outline" size={54} color={FoodColors.muted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.mutedText}>
            Add something delicious to get started.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>Browse restaurants</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {activeCarts.map((cart) => (
            <View key={cart.cartId}>
              <View style={styles.storeHeading}>
                <Text style={styles.storeName}>{cart.restaurantName}</Text>
                <Text style={styles.storeItemCount}>
                  {cart.items.reduce((count, item) => count + item.quantity, 0)}{" "}
                  item
                  {cart.items.reduce(
                    (count, item) => count + item.quantity,
                    0,
                  ) === 1
                    ? ""
                    : "s"}
                </Text>
              </View>
              <View style={styles.items}>
                {cart.items.map((item) => (
                  <View key={item.cartItemId} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.menuItemName}</Text>
                      <Text style={styles.itemPrice}>
                        R{item.unitPrice.toFixed(2)} each
                      </Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <Pressable
                        accessibilityLabel={`Decrease ${item.menuItemName}`}
                        onPress={() =>
                          changeQuantity(item.cartItemId, item.quantity - 1)
                        }
                        style={styles.quantityButton}
                      >
                        <Ionicons
                          name="remove"
                          size={17}
                          color={FoodColors.ink}
                        />
                      </Pressable>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <Pressable
                        accessibilityLabel={`Increase ${item.menuItemName}`}
                        onPress={() =>
                          changeQuantity(item.cartItemId, item.quantity + 1)
                        }
                        style={styles.quantityButton}
                      >
                        <Ionicons name="add" size={17} color={FoodColors.ink} />
                      </Pressable>
                    </View>
                    <Text style={styles.subtotal}>
                      R{item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Store total</Text>
                  <Text style={styles.totalValue}>
                    R{cart.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <Pressable
                  style={[styles.checkoutButton]}
                  onPress={() => handleCheckout(cart)}
                >
                  <Text style={styles.checkoutText}>Checkout this store</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FoodColors.oat },
  content: { paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FoodColors.oat,
  },
  mutedText: { color: FoodColors.muted, marginTop: 8 },
  header: {
    padding: 22,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: FoodColors.tomato,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: FoodColors.ink,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 3,
  },
  subtitle: { color: FoodColors.muted, marginTop: 4 },
  storeHeading: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  storeName: { color: FoodColors.ink, fontSize: 18, fontWeight: "900" },
  storeItemCount: { color: FoodColors.muted, fontSize: 12 },
  items: {
    margin: 16,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },
  itemRow: {
    minHeight: 88,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },
  itemInfo: { flex: 1, paddingRight: 8 },
  itemName: { color: FoodColors.ink, fontSize: 15, fontWeight: "800" },
  itemPrice: { color: FoodColors.muted, fontSize: 12, marginTop: 4 },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: FoodColors.line,
    borderRadius: 8,
  },
  quantityButton: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    minWidth: 24,
    textAlign: "center",
    color: FoodColors.ink,
    fontWeight: "800",
  },
  subtotal: {
    width: 72,
    textAlign: "right",
    color: FoodColors.ink,
    fontWeight: "800",
    marginLeft: 8,
  },
  summary: {
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: { color: FoodColors.muted },
  summaryValue: { color: FoodColors.ink, fontWeight: "700" },
  totalLabel: { color: FoodColors.ink, fontSize: 18, fontWeight: "900" },
  totalValue: { color: FoodColors.tomato, fontSize: 20, fontWeight: "900" },
  checkoutButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  checkoutText: { color: FoodColors.onDark, fontWeight: "900", fontSize: 15 },
  empty: { alignItems: "center", padding: 52 },
  emptyTitle: {
    color: FoodColors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  primaryButton: {
    marginTop: 22,
    paddingHorizontal: 20,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: FoodColors.onDark, fontWeight: "800" },
});
