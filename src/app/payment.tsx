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
    if (!token || !orderId) return;

    try {
      setLoading(true);
      setError("");

      const result = await createYocoPayment(
        orderId,
        token
      );

      console.log("YOCO PAYMENT RESULT:", result);

setCheckoutUrl(result.redirectUrl);
    } catch (error) {
      console.error("Failed to create Yoco payment:", error);
      setError(
        "Unable to start payment. Please try again."
      );
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

  window.location.assign(checkoutUrl);
}

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Preparing secure payment...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Payment could not start
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={startPayment}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>💳</Text>

        <Text style={styles.title}>
          Secure Payment
        </Text>

        <Text style={styles.description}>
          Your order has been created successfully.
        </Text>

        <Text style={styles.description}>
          Continue to Yoco to securely complete your
          payment.
        </Text>

        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>
            Order
          </Text>

          <Text style={styles.orderNumber}>
            #{orderId}
          </Text>
        </View>

      <Pressable
  onPress={() => {
    console.log("PRESSABLE PRESSED");
    openPayment();
  }}
  style={{
    width: "100%",
    maxWidth: 400,
    backgroundColor: "red",
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    cursor: "pointer",
  }}
>
  <Text
    style={{
      color: "white",
      fontSize: 18,
      fontWeight: "800",
    }}
  >
    CONTINUE TO PAYMENT
  </Text>
</Pressable>

        <Text style={styles.secureText}>
          🔒 Secure payment powered by Yoco
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#F7F8FA",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  icon: {
    fontSize: 52,
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 12,
  },

  description: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 380,
    marginBottom: 4,
  },

  orderCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 25,
    marginBottom: 25,
    alignItems: "center",
  },

  orderLabel: {
    color: "#777",
    fontSize: 13,
  },

  orderNumber: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  payButton: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#F28C28",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  payButtonPressed: {
  opacity: 0.75,
},

payButtonDisabled: {
  opacity: 0.5,
},

  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secureText: {
    marginTop: 18,
    color: "#777",
    fontSize: 13,
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 10,
  },

  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#F28C28",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 10,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  backButton: {
    marginTop: 15,
    padding: 10,
  },

  backText: {
    color: "#1A4B6B",
    fontWeight: "600",
  },
});