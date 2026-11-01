import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/authContext";
import { confirmYocoPayment } from "../services/paymentService";

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId;
  const { token, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [requiresRefundReview, setRequiresRefundReview] = useState(false);
  const [requiresPaymentReview, setRequiresPaymentReview] = useState(false);
  const [message, setMessage] = useState("Checking your payment with Yoco...");

  const verifyPayment = useCallback(async () => {
    if (authLoading) return;

    if (!token || !orderId || !Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
      setVerified(false);
      setRequiresRefundReview(false);
      setRequiresPaymentReview(false);
      setMessage("We could not verify this payment. Sign in and open your order to check its current status.");
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const result = await confirmYocoPayment(Number(orderId), token);
      const isPaid = result.paymentStatus?.toUpperCase() === "PAID";
      const orderWasCancelled = result.orderStatus?.toUpperCase() === "CANCELLED";
      const refundReviewRequired = isPaid && orderWasCancelled;
      const paymentReviewRequired = isPaid && !orderWasCancelled && result.requiresReconciliation === true;

      // Once the backend has verified payment, take the customer straight to
      // the order-tracking screen instead of leaving them on a success screen.
      if (isPaid && !orderWasCancelled && !paymentReviewRequired) {
        router.replace({
          pathname: "/order",
          params: { orderId: String(orderId) },
        });
        return;
      }

      setRequiresRefundReview(refundReviewRequired);
      setRequiresPaymentReview(paymentReviewRequired);
      setVerified(isPaid && !orderWasCancelled && !paymentReviewRequired);
      setMessage(
        refundReviewRequired
          ? "Yoco confirmed the payment, but this order was cancelled. Refund review has been opened; the order will not be fulfilled. Please contact support for an update."
          : paymentReviewRequired
            ? "Yoco confirmed a payment, but this transaction needs further review before the order can proceed. Do not make another payment. Please contact support for an update."
            : isPaid
              ? "Yoco has confirmed your payment."
              : "Yoco has not confirmed this payment yet. You can check again shortly."
      );
    } catch {
      setVerified(false);
      setRequiresRefundReview(false);
      setRequiresPaymentReview(false);
      setMessage("We could not verify your payment right now. This screen has not marked your order as paid. Please try checking again.");
    } finally {
      setChecking(false);
    }
  }, [authLoading, token, orderId]);

  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Trigger asynchronous verification after auth restoration.
    void verifyPayment();
  }, [authLoading, verifyPayment]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.icon, !verified && styles.pendingIcon]}>
          {verified ? "✓" : checking ? "…" : "!"}
        </Text>

        <Text style={styles.title}>
          {authLoading || checking
            ? "Verifying Payment"
            : requiresRefundReview
              ? "Order Cancelled — Refund Review"
              : requiresPaymentReview
                ? "Payment Review Required"
                : verified
                ? "Payment Successful"
                : "Payment Not Yet Verified"}
        </Text>

        <Text style={styles.message}>{message}</Text>

        {orderId ? <Text style={styles.order}>Order #{orderId}</Text> : null}

        {!verified && !checking && !requiresRefundReview && !requiresPaymentReview ? (
          <Pressable style={styles.button} onPress={() => void verifyPayment()}>
            <Text style={styles.buttonText}>Check Payment Again</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.button, (!verified || checking) && styles.disabledButton]}
          disabled={!verified || checking}
          onPress={() =>
            router.push({ pathname: "/order", params: { orderId: orderId ?? "" } })
          }
        >
          <Text style={styles.buttonText}>Track My Order</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.replace("/")}>
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
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 45,
    fontWeight: "700",
    marginBottom: 20,
  },
  pendingIcon: {
    backgroundColor: "#FFF3E0",
    color: "#E65100",
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
    marginTop: 18,
  },
  disabledButton: {
    opacity: 0.45,
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
