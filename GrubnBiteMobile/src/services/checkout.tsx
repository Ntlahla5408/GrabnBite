import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    Address,
    getAddresses,
} from "../services/addressService";
import { apiRequest } from "../services/api";
import { Cart, getCart } from "../services/cartService";

interface CheckoutResponse {
  orderId: number;
  paymentId?: number;
  message?: string;
}

const COLORS = {
  primary: "#1A4B6B",
  primaryDark: "#071B2C",
  secondary: "#2C7A9E",
  accent: "#F4C542",
  background: "#F7F9FB",
  white: "#FFFFFF",
  text: "#17212B",
  muted: "#6B7785",
  border: "#DDE4EA",
  danger: "#C0392B",
  success: "#2E7D32",
};

export default function CheckoutScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      const [cartData, addressData] = await Promise.all([
        getCart(),
        getAddresses(),
      ]);

      setCart(cartData);
      setAddresses(addressData);

      const defaultAddress = addressData.find(
        (address) => address.isDefault,
      );

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addressData.length > 0) {
        setSelectedAddressId(addressData[0].id);
      }
    } catch (error) {
      console.error("Failed to load checkout:", error);

      Alert.alert(
        "Unable to load checkout",
        error instanceof Error
          ? error.message
          : "Something went wrong while loading checkout.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const subtotal = useMemo(() => {
    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => {
      const price = item.menuItem?.price ?? 0;

      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const deliveryFee: number = 0;

  const total = subtotal + deliveryFee;

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  const handleAddAddress = () => {
    router.push("/addresses");
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert(
        "Your cart is empty",
        "Add some items before checking out.",
      );
      return;
    }

    if (!selectedAddressId) {
      Alert.alert(
        "Delivery address required",
        "Please select a delivery address before placing your order.",
      );
      return;
    }

    try {
      setPlacingOrder(true);

      /*
       * The checkout endpoint expects:
       *
       * {
       *   cartId: number,
       *   deliveryAddressId: number
       * }
       */

      const response = await apiRequest<CheckoutResponse>(
        "/api/Checkout",
        {
          method: "POST",
          body: JSON.stringify({
            cartId: cart.id,
            deliveryAddressId: selectedAddressId,
          }),
        },
      );

      if (!response?.orderId) {
        throw new Error(
          "The order was created, but no order ID was returned.",
        );
      }

      router.replace({
        pathname: "/payment",
        params: {
          orderId: String(response.orderId),
        },
      });
    } catch (error) {
      console.error("Checkout failed:", error);

      Alert.alert(
        "Checkout failed",
        error instanceof Error
          ? error.message
          : "We could not place your order. Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Preparing your checkout...
        </Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyIcon}>🛒</Text>

        <Text style={styles.emptyTitle}>
          Your cart is empty
        </Text>

        <Text style={styles.emptyText}>
          Add some food to your cart before continuing to
          checkout.
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>
            Checkout
          </Text>

          <Text style={styles.headerSubtitle}>
            Review your order before placing it
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* DELIVERY ADDRESS */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Delivery address
              </Text>

              <Text style={styles.sectionSubtitle}>
                Where should we deliver your order?
              </Text>
            </View>

            <Pressable onPress={handleAddAddress}>
              <Text style={styles.manageText}>
                Manage
              </Text>
            </Pressable>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.noAddressBox}>
              <Text style={styles.noAddressTitle}>
                No delivery address
              </Text>

              <Text style={styles.noAddressText}>
                You need to add an address before placing
                your order.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleAddAddress}
              >
                <Text style={styles.secondaryButtonText}>
                  Add address
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((address) => {
                const selected =
                  address.id === selectedAddressId;

                return (
                  <Pressable
                    key={address.id}
                    style={[
                      styles.addressOption,
                      selected &&
                        styles.addressOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedAddressId(address.id)
                    }
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {selected && (
                        <View
                          style={styles.radioInner}
                        />
                      )}
                    </View>

                    <View style={styles.addressOptionContent}>
                      <View style={styles.addressLabelRow}>
                        <Text
                          style={styles.addressOptionLabel}
                        >
                          {address.label}
                        </Text>

                        {address.isDefault && (
                          <View
                            style={styles.defaultBadge}
                          >
                            <Text
                              style={styles.defaultBadgeText}
                            >
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.addressOptionText}>
                        {address.streetAddress}
                      </Text>

                      <Text style={styles.addressOptionText}>
                        {address.city}, {address.province}
                      </Text>

                      <Text style={styles.addressOptionText}>
                        {address.postalCode}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ORDER ITEMS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your order
          </Text>

          <Text style={styles.sectionSubtitle}>
            {cart.items.length}{" "}
            {cart.items.length === 1 ? "item" : "items"}
          </Text>

          <View style={styles.itemsContainer}>
            {cart.items.map((item) => {
              const itemPrice =
                item.menuItem?.price ?? 0;

              const itemTotal =
                itemPrice * item.quantity;

              return (
                <View
                  key={item.id}
                  style={styles.orderItem}
                >
                  <View style={styles.foodIcon}>
                    <Text style={styles.foodEmoji}>
                      🍔
                    </Text>
                  </View>

                  <View style={styles.orderItemDetails}>
                    <Text
                      style={styles.orderItemName}
                      numberOfLines={2}
                    >
                      {item.menuItem?.name ??
                        "Menu item"}
                    </Text>

                    <Text style={styles.quantityText}>
                      Quantity: {item.quantity}
                    </Text>

                    <Text style={styles.unitPrice}>
                      R{itemPrice.toFixed(2)} each
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    R{itemTotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* PRICE SUMMARY */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order summary
          </Text>

          <View style={styles.summaryCard}>
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
                {deliveryFee === 0
                  ? "Calculated at checkout"
                  : `R${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                R{total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* PLACE ORDER */}

        <View style={styles.placeOrderContainer}>
          {selectedAddress && (
            <View style={styles.selectedAddressPreview}>
              <Text style={styles.previewLabel}>
                Delivering to
              </Text>

              <Text style={styles.previewTitle}>
                {selectedAddress.label}
              </Text>

              <Text style={styles.previewText}>
                {selectedAddress.streetAddress},{" "}
                {selectedAddress.city}
              </Text>
            </View>
          )}

          <Pressable
            style={[
              styles.placeOrderButton,
              (placingOrder ||
                !selectedAddressId) &&
                styles.disabledButton,
            ]}
            onPress={handlePlaceOrder}
            disabled={
              placingOrder || !selectedAddressId
            }
          >
            {placingOrder ? (
              <ActivityIndicator
                color={COLORS.white}
              />
            ) : (
              <Text style={styles.placeOrderText}>
                Place Order • R{total.toFixed(2)}
              </Text>
            )}
          </Pressable>

          <Text style={styles.secureText}>
            🔒 Your order details are securely submitted.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 400,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF3F7",
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 34,
    lineHeight: 36,
    color: COLORS.primaryDark,
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 60,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
  },

  manageText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },

  addressList: {
    gap: 10,
  },

  addressOption: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  addressOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F1F7FA",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#AAB5BE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    marginTop: 2,
  },

  radioOuterSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  addressOptionContent: {
    flex: 1,
  },

  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },

  addressOptionLabel: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },

  defaultBadge: {
    backgroundColor: "#E7F4E8",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  defaultBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: "800",
  },

  addressOptionText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },

  noAddressBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 20,
  },

  noAddressTitle: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },

  noAddressText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  secondaryButton: {
    alignSelf: "flex-start",
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  itemsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginTop: 14,
    overflow: "hidden",
  },

  orderItem: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  foodIcon: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#FFF5D9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  foodEmoji: {
    fontSize: 25,
  },

  orderItemDetails: {
    flex: 1,
  },

  orderItemName: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },

  quantityText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  unitPrice: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  itemTotal: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },

  summaryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 14,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 220,
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 5,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  totalLabel: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },

  totalValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  placeOrderContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedAddressPreview: {
    backgroundColor: "#F3F7F9",
    borderRadius: 10,
    padding: 13,
    marginBottom: 14,
  },

  previewLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  previewTitle: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },

  previewText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 2,
  },

  placeOrderButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  placeOrderText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 22,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },

  secureText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 12,
  },
});
