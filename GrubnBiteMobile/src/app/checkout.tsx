import { Ionicons } from "@expo/vector-icons";
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

import { FoodColors } from "@/constants/theme";
import { useCart } from "@/context/CartContext";
import { getAddresses, type Address } from "@/services/addressService";
import { checkoutCart } from "@/services/cartService";

export default function CheckoutScreen() {
  const { cartId } = useLocalSearchParams<{ cartId?: string }>();
  const { carts, setPendingCheckout } = useCart();
  const selectedCartId = Number(cartId);
  const cart = carts.find((item) => item.cartId === selectedCartId);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const data = await getAddresses();
        setAddresses(data);
        setSelectedAddressId(
          data.find((address) => address.isDefault)?.id ?? data[0]?.id ?? null,
        );
      } catch (error) {
        Alert.alert(
          "Could not load addresses",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, []);

  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert("Cart unavailable", "This store cart is empty.");
      return;
    }

    if (!selectedAddressId) {
      Alert.alert(
        "Choose a delivery address",
        "Select an address to continue.",
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setPendingCheckout(cart);
      const result = await checkoutCart(cart.cartId, selectedAddressId);

      if (!result.orderId) {
        throw new Error("Checkout completed without an order ID.");
      }

      router.replace({
        pathname: "/orders/[id]",
        params: { id: String(result.orderId) },
      });
    } catch (error) {
      setPendingCheckout(cart);
      Alert.alert(
        "Checkout failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={FoodColors.tomato} />
        <Text style={styles.muted}>Loading checkout...</Text>
      </View>
    );
  }

  if (!cart) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={FoodColors.tomato}
        />
        <Text style={styles.emptyTitle}>Cart unavailable</Text>
        <Text style={styles.muted}>Return to your cart and try again.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Back to cart</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={FoodColors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CHECKOUT</Text>
          <Text style={styles.title}>{cart.restaurantName}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Review your order</Text>
      <View style={styles.card}>
        {cart.items.map((item) => (
          <View key={item.cartItemId} style={styles.row}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
              <Text style={styles.muted}>Qty {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>R{item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Store total</Text>
          <Text style={styles.total}>R{cart.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Pressable onPress={() => router.push("/addresses")}>
          <Text style={styles.manageLink}>Manage</Text>
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.itemName}>No saved addresses</Text>
          <Text style={styles.muted}>
            Add an address before placing your order.
          </Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/addresses")}
          >
            <Text style={styles.secondaryButtonText}>Add address</Text>
          </Pressable>
        </View>
      ) : (
        addresses.map((address) => {
          const selected = address.id === selectedAddressId;
          return (
            <Pressable
              key={address.id}
              style={[
                styles.addressCard,
                selected && styles.addressCardSelected,
              ]}
              onPress={() => setSelectedAddressId(address.id)}
            >
              <View style={styles.addressIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={FoodColors.tomato}
                />
              </View>
              <View style={styles.addressCopy}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.muted}>
                  {address.streetAddress}, {address.city}, {address.province}{" "}
                  {address.postalCode}
                </Text>
              </View>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={23}
                color={selected ? FoodColors.tomato : FoodColors.muted}
              />
            </Pressable>
          );
        })
      )}

      <Text style={styles.reviewNote}>
        Review your order details before continuing to payment.
      </Text>

      <Pressable
        style={[styles.placeButton, placingOrder && styles.disabled]}
        onPress={placeOrder}
        disabled={placingOrder || !selectedAddressId}
      >
        {placingOrder ? (
          <ActivityIndicator color={FoodColors.onDark} />
        ) : (
          <Text style={styles.placeButtonText}>
            Place order and continue to payment
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FoodColors.oat },
  content: { paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: FoodColors.oat,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, marginLeft: 8 },
  eyebrow: {
    color: FoodColors.tomato,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: FoodColors.ink,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    color: FoodColors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  manageLink: { color: FoodColors.tomato, fontWeight: "800" },
  card: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  itemCopy: { flex: 1, paddingRight: 12 },
  itemName: { color: FoodColors.ink, fontSize: 15, fontWeight: "800" },
  itemTotal: { color: FoodColors.ink, fontWeight: "800" },
  muted: { color: FoodColors.muted, marginTop: 4, lineHeight: 19 },
  divider: { height: 1, backgroundColor: FoodColors.line, marginVertical: 8 },
  totalLabel: { color: FoodColors.ink, fontSize: 16, fontWeight: "900" },
  total: { color: FoodColors.tomato, fontSize: 19, fontWeight: "900" },
  addressCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FoodColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },
  addressCardSelected: { borderColor: FoodColors.tomato, borderWidth: 2 },
  addressIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: FoodColors.peach,
  },
  addressCopy: { flex: 1, marginHorizontal: 12 },
  addressLabel: { color: FoodColors.ink, fontWeight: "900" },
  emptyTitle: {
    color: FoodColors.ink,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 14,
  },
  primaryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: FoodColors.onDark, fontWeight: "800" },
  secondaryButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: FoodColors.tomato, fontWeight: "800" },
  reviewNote: {
    marginHorizontal: 16,
    marginTop: 22,
    color: FoodColors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  placeButton: {
    margin: 16,
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  placeButtonText: {
    color: FoodColors.onDark,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  disabled: { opacity: 0.6 },
});
