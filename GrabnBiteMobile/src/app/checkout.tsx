import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { getAddresses } from "../services/addressService";
import { getCart } from "../services/cartService";
import { Cart } from "../types/cart";
import { createCheckout } from "../services/checkoutService";
import { Address } from "../types/address";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

export default function CheckoutScreen() {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { token, loading: authLoading } = useAuth();

  const params = useLocalSearchParams<{
    cartId?: string;
    restaurantId?: string;
  }>();

  const cartId = Number(params.cartId);
  const restaurantId = Number(params.restaurantId);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const loadAddresses = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [result, customerCarts] = await Promise.all([getAddresses(token), getCart(token)]);
      setError("");
      setAddresses(result);
      const matchingCart = customerCarts.find((customerCart) => customerCart.cartId === cartId && customerCart.restaurantId === restaurantId && customerCart.items.length > 0);
      setCart(matchingCart ?? null);
      if (!matchingCart) setError("This cart is empty or is no longer available. Please return to your cart.");

      // Automatically select the default address.
      const defaultAddress = result.find((address) => address.isDefault);

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.addressId);
      } else if (result.length > 0) {
        setSelectedAddressId(result[0].addressId);
      } else {
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      setError("Unable to load your delivery addresses.");
    } finally {
      setLoading(false);
    }
  }, [token, cartId, restaurantId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    void loadAddresses();
  }, [authLoading, token, loadAddresses]);

  async function handleCheckout() {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!cart) {
      setError("Your cart is no longer available. Please return to your cart.");
      return;
    }

    if (!cartId) {
      setError("Invalid cart.");
      return;
    }

    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    try {
      setCheckingOut(true);
      setError("");

      const result = await createCheckout(
        {
          cartId,
          deliveryAddressId: selectedAddressId,
        },
        token,
      );

      console.log("CHECKOUT RESULT:", result);

      // Create the order, then continue to the existing Yoco payment screen.
      router.push({
        pathname: "/payment",
        params: {
          orderId: result.orderId.toString(),
          restaurantId: restaurantId.toString(),
        },
      });
    } catch (error) {
      console.error("Checkout failed:", error);
      setError("Unable to create your order. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />

        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading checkout...</Text>
      </View>
    );
  }

  const selectedAddress = addresses.find((address) => address.addressId === selectedAddressId);
  const deliveryAddress = selectedAddress ? [selectedAddress.streetAddress, selectedAddress.city, selectedAddress.province, selectedAddress.postalCode].map((part) => part?.trim()).filter(Boolean).join(", ") : "";
  const itemSubtotal = cart?.items.reduce((total, item) => total + item.subtotal, 0) ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.buttonPressed]} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Review your order</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Check your items, total and delivery address before payment.</Text>
        </View>

        {error ? <View style={[styles.errorBox, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.errorText, { color: theme === "dark" ? "#FCA5A5" : "#B42318" }]}>{error}</Text></View> : null}

        {!cart ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Order summary unavailable</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Return to your cart and try again.</Text>
            <Pressable style={({ pressed }) => [styles.addAddressButton, { backgroundColor: colors.accent }, pressed && styles.addAddressButtonPressed]} onPress={() => router.replace("/cart")}><Text style={styles.addAddressButtonText}>Back to Cart</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeadingRow}>
                <View><Text style={[styles.sectionTitle, { color: colors.text }]}>{cart.restaurantName}</Text><Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{cart.items.length} {cart.items.length === 1 ? "item" : "items"}</Text></View>
                <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>ORDER ITEMS</Text>
              </View>
              {cart.items.map((item) => (
                <View key={item.cartItemId} style={[styles.orderItem, { borderTopColor: colors.border }]}>
                  <View style={styles.orderItemInfo}><Text style={[styles.orderItemName, { color: colors.text }]}>{item.menuItemName}</Text><Text style={[styles.orderItemMeta, { color: colors.textSecondary }]}>{item.quantity} × R{item.unitPrice.toFixed(2)}</Text></View>
                  <Text style={[styles.orderItemAmount, { color: colors.text }]}>R{item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
              <View style={[styles.priceBreakdown, { borderTopColor: colors.border }]}>
                <View style={styles.priceRow}><Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Food subtotal</Text><Text style={[styles.priceValue, { color: colors.text }]}>R{itemSubtotal.toFixed(2)}</Text></View>
                <View style={styles.priceRow}><Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Delivery fee</Text><Text style={[styles.priceValue, { color: colors.textSecondary }]}>Not configured</Text></View>
                <View style={styles.priceRow}><Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Service fee</Text><Text style={[styles.priceValue, { color: colors.textSecondary }]}>Not configured</Text></View>
                <View style={[styles.grandTotalRow, { borderTopColor: colors.border }]}><Text style={[styles.grandTotalLabel, { color: colors.text }]}>Current order total</Text><Text style={[styles.grandTotalValue, { color: colors.accent }]}>R{itemSubtotal.toFixed(2)}</Text></View>
                <Text style={[styles.feeNotice, { color: colors.textSecondary }]}>Delivery and service fees are not currently included in GrabnBite's checkout calculation. The order total shown is the food subtotal. Menu prices are revalidated when the order is created, so the final subtotal may change if a restaurant has updated its prices.</Text>
              </View>
            </View>

            <View style={styles.addressSectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery address</Text><Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Choose where this order should be delivered.</Text></View>
            {addresses.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No delivery addresses</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add a delivery address before placing your order.</Text>
                <Pressable style={({ pressed }) => [styles.addAddressButton, { backgroundColor: colors.accent }, pressed && styles.addAddressButtonPressed]} onPress={() => router.push("/addresses")}><Text style={styles.addAddressButtonText}>+ Add Address</Text></Pressable>
              </View>
            ) : (
              <>
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.addressId;
                  const combinedAddress = [address.streetAddress, address.city, address.province, address.postalCode].map((part) => part?.trim()).filter(Boolean).join(", ");
                  return (
                    <Pressable key={address.addressId} style={({ pressed }) => [styles.addressCard, { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border }, selected && styles.selectedAddressCard, pressed && styles.addressCardPressed]} onPress={() => setSelectedAddressId(address.addressId)}>
                      <View style={styles.addressContent}>
                        <View style={styles.addressHeader}><Text style={[styles.addressLabel, { color: colors.text }]}>{address.label || "Delivery Address"}</Text>{address.isDefault && <View style={[styles.defaultBadge, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}><Text style={[styles.defaultText, { color: colors.accent }]}>Default</Text></View>}</View>
                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>{combinedAddress}</Text>
                      </View>
                      <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.border }, selected && styles.radioSelected]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}</View>
                    </Pressable>
                  );
                })}
                <Pressable style={({ pressed }) => [styles.addNewAddressButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.addNewAddressButtonPressed]} onPress={() => router.push("/addresses")}>
                  <View style={[styles.addNewAddressIcon, { backgroundColor: colors.accentSoft }]}><Text style={[styles.addNewAddressIconText, { color: colors.accent }]}>+</Text></View>
                  <View><Text style={[styles.addNewAddressTitle, { color: colors.text }]}>Add a new address</Text><Text style={[styles.addNewAddressSubtitle, { color: colors.textSecondary }]}>Deliver to a different location</Text></View>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>

      {cart && addresses.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.bottomInfo}><Text style={[styles.bottomLabel, { color: colors.textSecondary }]}>Delivering to</Text><Text style={[styles.bottomValue, { color: colors.text }]} numberOfLines={2}>{selectedAddress ? deliveryAddress : "Select an address"}</Text></View>
          <Pressable style={({ pressed }) => [styles.checkoutButton, { backgroundColor: colors.accent }, (checkingOut || !selectedAddressId) && styles.disabledButton, pressed && !checkingOut && selectedAddressId && styles.checkoutButtonPressed]} onPress={handleCheckout} disabled={checkingOut || !selectedAddressId}>
            {checkingOut ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.checkoutButtonText}>Proceed to Payment</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14 },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  backText: { fontSize: 32, lineHeight: 34, marginTop: -3 },
  buttonPressed: { opacity: 0.7 },
  header: { marginBottom: 22 },
  title: { fontSize: 29, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 24 },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  sectionSubtitle: { marginTop: 4, fontSize: 12 },
  sectionEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  orderItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingVertical: 14 },
  orderItemInfo: { flex: 1, paddingRight: 12 },
  orderItemName: { fontSize: 15, fontWeight: "700" },
  orderItemMeta: { fontSize: 12, marginTop: 4 },
  orderItemAmount: { fontSize: 14, fontWeight: "800" },
  priceBreakdown: { borderTopWidth: 1, paddingTop: 14, marginTop: 2 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  priceLabel: { fontSize: 13 },
  priceValue: { fontSize: 13, fontWeight: "600" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 14, marginTop: 3 },
  grandTotalLabel: { fontSize: 15, fontWeight: "800" },
  grandTotalValue: { fontSize: 21, fontWeight: "900" },
  feeNotice: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  addressSectionHeading: { marginBottom: 13 },
  addressCard: { borderRadius: 16, padding: 17, marginBottom: 11, borderWidth: 1, minHeight: 95 },
  selectedAddressCard: { borderWidth: 2 },
  addressCardPressed: { opacity: 0.85 },
  addressContent: { paddingRight: 34 },
  addressHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addressLabel: { fontSize: 15, fontWeight: "800", flex: 1 },
  defaultBadge: { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  defaultText: { fontSize: 10, fontWeight: "800" },
  addressText: { fontSize: 13, lineHeight: 19 },
  radio: { position: "absolute", right: 16, top: 17, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderWidth: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  addNewAddressButton: { borderRadius: 15, borderWidth: 1, borderStyle: "dashed", padding: 15, marginTop: 2, flexDirection: "row", alignItems: "center" },
  addNewAddressButtonPressed: { opacity: 0.75 },
  addNewAddressIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  addNewAddressIconText: { fontSize: 25, fontWeight: "500" },
  addNewAddressTitle: { fontSize: 14, fontWeight: "800" },
  addNewAddressSubtitle: { fontSize: 12, marginTop: 3 },
  emptyCard: { paddingHorizontal: 22, paddingVertical: 36, borderRadius: 16, alignItems: "center", borderWidth: 1, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  emptyText: { textAlign: "center", lineHeight: 21, fontSize: 13, maxWidth: 400 },
  addAddressButton: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 11 },
  addAddressButtonPressed: { opacity: 0.85 },
  addAddressButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 14 },
  errorText: { fontSize: 13, textAlign: "center" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bottomInfo: { flex: 1, paddingRight: 4 },
  bottomLabel: { fontSize: 10 },
  bottomValue: { fontWeight: "700", fontSize: 12, marginTop: 3 },
  checkoutButton: { paddingHorizontal: 17, paddingVertical: 14, borderRadius: 12, minHeight: 48, alignItems: "center", justifyContent: "center" },
  checkoutButtonPressed: { opacity: 0.85 },
  checkoutButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  disabledButton: { opacity: 0.55 },
});
