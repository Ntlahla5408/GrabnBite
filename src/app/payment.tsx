import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { createYocoPayment } from "../services/paymentService";

export default function PaymentScreen() {
  const { token } = useAuth();

  const params = useLocalSearchParams<{
    orderId?: string;
    restaurantId?: string;
  }>();

  const orderId = Number(params.orderId);

  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [error, setError] = useState("");
  const [openingPayment, setOpeningPayment] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!orderId) {
      setError("Invalid order.");
      setLoading(false);
      return;
    }

    startPayment();
  }, [token, orderId]);

  async function startPayment() {
    if (!token || !orderId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createYocoPayment(orderId, token);

      console.log("YOCO PAYMENT RESULT:", result);

      setCheckoutUrl(result.redirectUrl);
    } catch (error) {
      console.error("Failed to create Yoco payment:", error);

      setError("Unable to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function openPayment() {
    console.log("================================");
    console.log("PAY BUTTON CLICKED");
    console.log("Checkout URL:", checkoutUrl);
    console.log("================================");

    if (!checkoutUrl) {
      console.log("NO CHECKOUT URL");
      return;
    }

    try {
      setOpeningPayment(true);

      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("Failed to open payment:", error);
      setOpeningPayment(false);
      setError("Unable to open the payment page. Please try again.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingIconContainer}>
          <Text style={styles.loadingIcon}>💳</Text>
        </View>

        <ActivityIndicator size="large" color="#F97316" />

        <Text style={styles.loadingTitle}>Preparing secure payment...</Text>

        <Text style={styles.loadingText}>
          Please wait while we connect you to Yoco.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>!</Text>
        </View>

        <Text style={styles.errorTitle}>Payment could not start</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={startPayment}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back to Checkout</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Payment Icon */}
        <View style={styles.paymentIconContainer}>
          <Text style={styles.paymentIcon}>💳</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Secure Payment</Text>

        <Text style={styles.description}>
          Your order has been created successfully.
        </Text>

        <Text style={styles.description}>
          Continue to Yoco to securely complete your payment.
        </Text>

        {/* Order Card */}
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>ORDER</Text>

          <Text style={styles.orderNumber}>#{orderId}</Text>

          <View style={styles.orderDivider} />

          <Text style={styles.orderDescription}>
            Your payment will be securely processed by Yoco.
          </Text>
        </View>

        {/* Payment Button */}
        <Pressable
          onPress={openPayment}
          disabled={openingPayment || !checkoutUrl}
          style={({ pressed }) => [
            styles.payButton,
            pressed && !openingPayment && styles.payButtonPressed,
            (openingPayment || !checkoutUrl) && styles.payButtonDisabled,
          ]}
        >
          {openingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Continue to Payment</Text>

              <Text style={styles.payButtonArrow}>→</Text>
            </>
          )}
        </Pressable>

        {/* Security */}
        <View style={styles.secureContainer}>
          <Text style={styles.secureIcon}>🔒</Text>

          <Text style={styles.secureText}>Secure payment powered by Yoco</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071B2C",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    backgroundColor: "#071B2C",
  },

  content: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  paymentIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  paymentIcon: {
    fontSize: 42,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    textAlign: "center",
    color: "#AFC0CC",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 390,
    marginBottom: 4,
  },

  orderCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0D2638",
    borderRadius: 16,
    padding: 20,
    marginTop: 26,
    marginBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#18384D",
  },

  orderLabel: {
    color: "#7F94A3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  orderNumber: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  orderDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#18384D",
    marginVertical: 15,
  },

  orderDescription: {
    color: "#7F94A3",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  payButton: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#F97316",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  payButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  payButtonDisabled: {
    opacity: 0.55,
  },

  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  payButtonArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  secureContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  secureIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  secureText: {
    color: "#7F94A3",
    fontSize: 12,
  },

  loadingIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingIcon: {
    fontSize: 34,
  },

  loadingTitle: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loadingText: {
    marginTop: 5,
    color: "#7F94A3",
    fontSize: 13,
    textAlign: "center",
  },

  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(248, 113, 113, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorIcon: {
    color: "#F87171",
    fontSize: 32,
    fontWeight: "800",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },

  errorText: {
    color: "#FCA5A5",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 380,
  },

  retryButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 11,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  backButton: {
    marginTop: 14,
    padding: 10,
  },

  backText: {
    color: "#AFC0CC",
    fontWeight: "600",
  },

  buttonPressed: {
    opacity: 0.7,
  },
});
