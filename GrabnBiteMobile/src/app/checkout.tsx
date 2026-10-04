import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { createCheckout } from "../services/checkoutService";
import { Address } from "../types/address";

export default function CheckoutScreen() {
  const { token } = useAuth();

  const params = useLocalSearchParams<{
    cartId?: string;
    restaurantId?: string;
  }>();

  const cartId = Number(params.cartId);
  const restaurantId = Number(params.restaurantId);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    loadAddresses();
  }, [token]);

  async function loadAddresses() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getAddresses(token);

      setAddresses(result);

      // Automatically select the default address.
      const defaultAddress = result.find((address) => address.isDefault);

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.addressId);
      } else if (result.length > 0) {
        setSelectedAddressId(result[0].addressId);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      setError("Unable to load your delivery addresses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!token) {
      router.replace("/login");
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

      // We will connect this to payment next.
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />

        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>

          <Text style={styles.subtitle}>
            Choose where you want your order delivered.
          </Text>
        </View>

        {/* Address Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            <Text style={styles.sectionSubtitle}>
              Select an address for this order
            </Text>
          </View>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
            </View>

            <Text style={styles.emptyTitle}>No delivery addresses</Text>

            <Text style={styles.emptyText}>
              Add a delivery address before placing your order.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.addAddressButton,
                pressed && styles.addAddressButtonPressed,
              ]}
              onPress={() => router.push("/addresses")}
            >
              <Text style={styles.addAddressButtonText}>+ Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {addresses.map((address) => {
              const selected = selectedAddressId === address.addressId;

              return (
                <Pressable
                  key={address.addressId}
                  style={({ pressed }) => [
                    styles.addressCard,
                    selected && styles.selectedAddressCard,
                    pressed && styles.addressCardPressed,
                  ]}
                  onPress={() => setSelectedAddressId(address.addressId)}
                >
                  <View style={styles.addressContent}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>
                        {address.label || "Delivery Address"}
                      </Text>

                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.addressText}>
                      {address.streetAddress}
                    </Text>

                    <Text style={styles.addressText}>
                      {address.city}, {address.province}
                    </Text>

                    <Text style={styles.addressText}>{address.postalCode}</Text>
                  </View>

                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  >
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}

            {/* Always available */}
            <Pressable
              style={({ pressed }) => [
                styles.addNewAddressButton,
                pressed && styles.addNewAddressButtonPressed,
              ]}
              onPress={() => router.push("/addresses")}
            >
              <View style={styles.addNewAddressIcon}>
                <Text style={styles.addNewAddressIconText}>+</Text>
              </View>

              <View>
                <Text style={styles.addNewAddressTitle}>Add a new address</Text>

                <Text style={styles.addNewAddressSubtitle}>
                  Deliver to a different location
                </Text>
              </View>
            </Pressable>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom checkout bar */}
      {addresses.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomLabel}>Delivery address</Text>

            <Text style={styles.bottomValue}>
              {selectedAddressId ? "Address selected" : "Select an address"}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.checkoutButton,
              checkingOut && styles.disabledButton,
              pressed && !checkingOut && styles.checkoutButtonPressed,
            ]}
            onPress={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutButtonText}>Continue</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071B2C",
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#071B2C",
  },

  loadingText: {
    marginTop: 10,
    color: "#AFC0CC",
    fontSize: 14,
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
    marginBottom: 22,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 6,
    color: "#AFC0CC",
    fontSize: 14,
    lineHeight: 20,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#7F94A3",
    fontSize: 12,
  },

  addressCard: {
    position: "relative",
    backgroundColor: "#0D2638",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#18384D",
    minHeight: 125,
  },

  selectedAddressCard: {
    borderColor: "#F97316",
    borderWidth: 2,
  },

  addressCardPressed: {
    opacity: 0.85,
  },

  addressContent: {
    paddingRight: 35,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  addressLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
  },

  defaultBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },

  defaultText: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
  },

  addressText: {
    color: "#AFC0CC",
    fontSize: 14,
    marginBottom: 3,
  },

  radio: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#526A7A",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#F97316",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F97316",
  },

  addNewAddressButton: {
    backgroundColor: "#0D2638",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#315067",
    borderStyle: "dashed",
    padding: 16,
    marginTop: 2,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  addNewAddressButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  addNewAddressIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  addNewAddressIconText: {
    color: "#F97316",
    fontSize: 25,
    fontWeight: "500",
  },

  addNewAddressTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  addNewAddressSubtitle: {
    color: "#7F94A3",
    fontSize: 12,
    marginTop: 3,
  },

  emptyCard: {
    backgroundColor: "#0D2638",
    paddingHorizontal: 24,
    paddingVertical: 45,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#18384D",
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyIcon: {
    fontSize: 34,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#AFC0CC",
    lineHeight: 21,
    fontSize: 14,
    maxWidth: 400,
  },

  addAddressButton: {
    marginTop: 20,
    backgroundColor: "#F97316",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 11,
  },

  addAddressButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  addAddressButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  errorBox: {
    backgroundColor: "rgba(248, 113, 113, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
    borderRadius: 12,
    padding: 13,
    marginTop: 8,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#071B2C",
    borderTopWidth: 1,
    borderTopColor: "#18384D",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomInfo: {
    flex: 1,
    paddingRight: 15,
  },

  bottomLabel: {
    color: "#7F94A3",
    fontSize: 11,
  },

  bottomValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 3,
  },

  checkoutButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 125,
    alignItems: "center",
  },

  checkoutButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
