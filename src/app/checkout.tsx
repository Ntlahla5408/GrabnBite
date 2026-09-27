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
    null
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
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const result = await getAddresses(token);

      setAddresses(result);

      // Automatically select the default address
      const defaultAddress = result.find(
        (address) => address.isDefault
      );

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
        token
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
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading checkout...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Checkout</Text>

        <Text style={styles.subtitle}>
          Choose where you want your order delivered.
        </Text>

        <Text style={styles.sectionTitle}>
          Delivery Address
        </Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No delivery addresses
            </Text>

            <Text style={styles.emptyText}>
              You need to add a delivery address before placing
              your order.
            </Text>

            <Pressable
              style={styles.addAddressButton}
              onPress={() => router.push("/addresses")}
            >
              <Text style={styles.addAddressText}>
                Add Address
              </Text>
            </Pressable>
          </View>
        ) : (
          addresses.map((address) => {
            const selected =
              selectedAddressId === address.addressId;

            return (
              <Pressable
                key={address.addressId}
                style={[
                  styles.addressCard,
                  selected && styles.selectedAddressCard,
                ]}
                onPress={() =>
                  setSelectedAddressId(address.addressId)
                }
              >
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>
                    {address.label || "Delivery Address"}
                  </Text>

                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>
                        Default
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.addressText}>
                  {address.streetAddress}
                </Text>

                <Text style={styles.addressText}>
                  {address.city}, {address.province}
                </Text>

                <Text style={styles.addressText}>
                  {address.postalCode}
                </Text>

                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}
                >
                  {selected && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </Pressable>
            );
          })
        )}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </ScrollView>

      {addresses.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>
              Delivery
            </Text>

            <Text style={styles.bottomValue}>
              Address selected
            </Text>
          </View>

          <Pressable
            style={[
              styles.checkoutButton,
              checkingOut && styles.disabledButton,
            ]}
            onPress={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutButtonText}>
                Place Order
              </Text>
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
    backgroundColor: "#F7F8FA",
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  backButton: {
    marginBottom: 18,
  },

  backText: {
    color: "#1A4B6B",
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    color: "#666",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#071B2C",
    marginBottom: 14,
  },

  addressCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EA",
  },

  selectedAddressCard: {
    borderColor: "#F28C28",
    borderWidth: 2,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  addressLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#071B2C",
    flex: 1,
  },

  defaultBadge: {
    backgroundColor: "#FFF1E3",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },

  defaultText: {
    color: "#F28C28",
    fontSize: 12,
    fontWeight: "700",
  },

  addressText: {
    color: "#555",
    fontSize: 14,
    marginBottom: 3,
  },

  radio: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#B8BEC5",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#F28C28",
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F28C28",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#071B2C",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#666",
    lineHeight: 21,
  },

  addAddressButton: {
    marginTop: 18,
    backgroundColor: "#F28C28",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  addAddressText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  errorText: {
    color: "#D32F2F",
    marginTop: 15,
    textAlign: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomLabel: {
    color: "#777",
    fontSize: 12,
  },

  bottomValue: {
    color: "#071B2C",
    fontWeight: "600",
    marginTop: 3,
  },

  checkoutButton: {
    backgroundColor: "#F28C28",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 125,
    alignItems: "center",
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