import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/authContext";
import { confirmYocoPayment } from "../services/paymentService";

export default function PaymentCancelledScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId;
  const { token, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [requiresReview, setRequiresReview] = useState(false);
  const [message, setMessage] = useState("Checking the payment status with Yoco...");

  const verifyPayment = useCallback(async () => {
    if (authLoading) return;

    if (!token || !orderId || !Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
      setPaymentStatus("");
      setRequiresReview(false);
      setMessage("We could not verify this payment. Sign in and open your order to check its status.");
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const result = await confirmYocoPayment(Number(orderId), token);
      const status = result.paymentStatus?.toUpperCase() ?? "";
      const orderWasCancelled = result.orderStatus?.toUpperCase() === "CANCELLED";
      const reviewRequired =
        result.requiresReconciliation === true ||
        orderWasCancelled ||
        (status === "PAID" && result.refundStatus !== "NOT_REQUIRED");

      setPaymentStatus(status);
      setRequiresReview(reviewRequired);

      if (status === "PAID" && !reviewRequired) {
        router.replace({ pathname: "/order", params: { orderId: String(orderId) } });
        return;
      }

      setMessage(
        orderWasCancelled && status === "PAID"
          ? "Yoco confirmed the payment, but this order was cancelled. Refund review is required. Please contact support; the order will not be fulfilled."
          : reviewRequired
            ? "Yoco confirmed a payment that needs further review. Do not make another payment. Please contact support for an update."
            : status === "FAILED"
              ? "Yoco confirmed that this checkout was not completed. You can safely try the payment again."
              : "The cancel redirect does not prove that the payment failed. Yoco has not confirmed the final status yet. Check again shortly and do not make another payment while it is being verified."
      );
    } catch {
      setPaymentStatus("");
      setRequiresReview(false);
      setMessage("We could not verify the payment right now. It has not been marked as paid. Please check again; do not make another payment until the status is confirmed.");
    } finally {
      setChecking(false);
    }
  }, [authLoading, token, orderId]);

  useEffect(() => {
    if (authLoading) return;
    void verifyPayment();
  }, [authLoading, verifyPayment]);

  const paymentFailed = paymentStatus === "FAILED" && !requiresReview;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.icon, paymentFailed && styles.failedIcon]}>
          {checking ? "…" : paymentFailed ? "×" : "!"}
        </Text>

        <Text style={styles.title}>
          {authLoading || checking
            ? "Verifying Payment"
            : requiresReview
              ? "Payment Review Required"
              : paymentFailed
                ? "Payment Not Completed"
                : "Payment Not Yet Verified"}
        </Text>

        <Text style={styles.message}>{message}</Text>

        {orderId ? <Text style={styles.order}>Order #{orderId}</Text> : null}

        {!checking && paymentFailed ? (
          <Pressable
            style={styles.button}
            onPress={() => router.replace({ pathname: "/payment", params: { orderId: String(orderId) } })}
          >
            <Text style={styles.buttonText}>Try Payment Again</Text>
          </Pressable>
        ) : null}

        {!checking && !paymentFailed && !requiresReview ? (
          <Pressable style={styles.button} onPress={() => void verifyPayment()}>
            <Text style={styles.buttonText}>Check Payment Again</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.secondaryText}>Back to Home</Text>
        </Pressable>

        {checking ? <ActivityIndicator style={styles.spinner} color="#F28C28" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF3E0",
    color: "#E65100",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 45,
    fontWeight: "700",
    marginBottom: 20,
  },
  failedIcon: {
    backgroundColor: "#FFEBEE",
    color: "#C62828",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
  },
  order: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#1A4B6B",
  },
  button: {
    width: "100%",
    backgroundColor: "#F28C28",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    marginTop: 15,
    padding: 10,
  },
  secondaryText: {
    color: "#1A4B6B",
    fontWeight: "600",
  },
  spinner: {
    marginTop: 14,
  },
});
