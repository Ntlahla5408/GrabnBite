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

import { apiRequest } from "../services/api";

interface Payment {
  id: number;
  orderId: number;
  paymentMethod: string;
  status: string;
  amount?: number;
  transactionReference?: string;
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

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{
    orderId: string;
  }>();

  const numericOrderId = Number(orderId);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("Card");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadPayment = async () => {
    if (!numericOrderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest<Payment>(
        `/api/Payment/${numericOrderId}`,
      );

      setPayment(data);

      if (data?.paymentMethod) {
        setSelectedMethod(data.paymentMethod);
      }
    } catch (error) {
      /*
       * A payment may not exist yet because checkout has
       * just created the order. That is okay.
       */
      console.log(
        "No existing payment found:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [numericOrderId]);

  const createPayment = async () => {
    if (!numericOrderId) {
      Alert.alert(
        "Payment error",
        "We could not identify your order.",
      );
      return;
    }

    try {
      setProcessing(true);

      const data = await apiRequest<Payment>(
        `/api/Payment/${numericOrderId}`,
        {
          method: "POST",
          body: JSON.stringify({
            paymentMethod: selectedMethod,
          }),
        },
      );

      setPayment(data);

      Alert.alert(
        "Payment created",
        "Your payment has been created successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to create payment:",
        error,
      );

      Alert.alert(
        "Payment failed",
        error instanceof Error
          ? error.message
          : "We could not create the payment.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const simulateSuccess = async () => {
    if (!numericOrderId) {
      return;
    }

    try {
      setProcessing(true);

      const data = await apiRequest<Payment>(
        `/api/Payment/${numericOrderId}/simulate-success`,
        {
          method: "POST",
        },
      );

      setPayment(data);

      Alert.alert(
        "Payment successful",
        "Your payment has been completed successfully.",
        [
          {
            text: "View Order",
            onPress: () => {
              router.replace({
                pathname: "/orders/[id]",
                params: {
                  id: String(numericOrderId),
                },
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        "Payment success simulation failed:",
        error,
      );

      Alert.alert(
        "Payment failed",
        error instanceof Error
          ? error.message
          : "We could not complete the payment.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const simulateFailure = async () => {
    if (!numericOrderId) {
      return;
    }

    try {
      setProcessing(true);

      const data = await apiRequest<Payment>(
        `/api/Payment/${numericOrderId}/simulate-failure`,
        {
          method: "POST",
        },
      );

      setPayment(data);

      Alert.alert(
        "Payment unsuccessful",
        "The payment was unsuccessful. You can try again.",
      );
    } catch (error) {
      console.error(
        "Payment failure simulation failed:",
        error,
      );

      Alert.alert(
        "Payment error",
        error instanceof Error
          ? error.message
          : "We could not process the payment.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const paymentStatus = payment?.status?.toLowerCase() ?? "";

  const isSuccessful =
    paymentStatus === "successful" ||
    paymentStatus === "success" ||
    paymentStatus === "paid" ||
    paymentStatus === "completed";

  const isFailed =
    paymentStatus === "failed" ||
    paymentStatus === "failure";

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading payment...
        </Text>
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
            Payment
          </Text>

          <Text style={styles.headerSubtitle}>
            Complete payment for Order #{numericOrderId}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ORDER INFORMATION */}

        <View style={styles.orderCard}>
          <View style={styles.orderIcon}>
            <Text style={styles.orderIconText}>
              #
            </Text>
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>
              ORDER
            </Text>

            <Text style={styles.orderNumber}>
              #{numericOrderId}
            </Text>

            {payment?.amount !== undefined && (
              <Text style={styles.orderAmount}>
                R{Number(payment.amount).toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        {/* PAYMENT STATUS */}

        {payment && (
          <View
            style={[
              styles.statusCard,
              isSuccessful &&
                styles.successStatusCard,
              isFailed &&
                styles.failedStatusCard,
            ]}
          >
            <Text style={styles.statusIcon}>
              {isSuccessful
                ? "✓"
                : isFailed
                  ? "!"
                  : "○"}
            </Text>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {isSuccessful
                  ? "Payment successful"
                  : isFailed
                    ? "Payment unsuccessful"
                    : "Payment pending"}
              </Text>

              <Text style={styles.statusText}>
                Status: {payment.status}
              </Text>

              {payment.transactionReference && (
                <Text style={styles.referenceText}>
                  Reference:{" "}
                  {payment.transactionReference}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* PAYMENT METHOD */}

        {!isSuccessful && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Choose payment method
            </Text>

            <Text style={styles.sectionSubtitle}>
              Select how you would like to pay.
            </Text>

            <View style={styles.methods}>
              <Pressable
                style={[
                  styles.methodCard,
                  selectedMethod === "Card" &&
                    styles.methodCardSelected,
                ]}
                onPress={() =>
                  setSelectedMethod("Card")
                }
                disabled={processing}
              >
                <View style={styles.methodIcon}>
                  <Text style={styles.methodEmoji}>
                    💳
                  </Text>
                </View>

                <View style={styles.methodContent}>
                  <Text style={styles.methodTitle}>
                    Card
                  </Text>

                  <Text style={styles.methodDescription}>
                    Pay using a debit or credit card
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    selectedMethod === "Card" &&
                      styles.radioSelected,
                  ]}
                >
                  {selectedMethod === "Card" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.methodCard,
                  selectedMethod === "Cash" &&
                    styles.methodCardSelected,
                ]}
                onPress={() =>
                  setSelectedMethod("Cash")
                }
                disabled={processing}
              >
                <View style={styles.methodIcon}>
                  <Text style={styles.methodEmoji}>
                    💵
                  </Text>
                </View>

                <View style={styles.methodContent}>
                  <Text style={styles.methodTitle}>
                    Cash
                  </Text>

                  <Text style={styles.methodDescription}>
                    Pay the driver when your order arrives
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    selectedMethod === "Cash" &&
                      styles.radioSelected,
                  ]}
                >
                  {selectedMethod === "Cash" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* PAYMENT ACTIONS */}

        {!isSuccessful && (
          <View style={styles.actionSection}>
            {!payment && (
              <Pressable
                style={[
                  styles.primaryButton,
                  processing &&
                    styles.disabledButton,
                ]}
                onPress={createPayment}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator
                    color={COLORS.white}
                  />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Continue to Payment
                  </Text>
                )}
              </Pressable>
            )}

            {payment && !isSuccessful && (
              <>
                <Pressable
                  style={[
                    styles.primaryButton,
                    processing &&
                      styles.disabledButton,
                  ]}
                  onPress={simulateSuccess}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator
                      color={COLORS.white}
                    />
                  ) : (
                    <Text
                      style={styles.primaryButtonText}
                    >
                      Simulate Successful Payment
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.failureButton,
                    processing &&
                      styles.disabledButton,
                  ]}
                  onPress={simulateFailure}
                  disabled={processing}
                >
                  <Text style={styles.failureButtonText}>
                    Simulate Failed Payment
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* SUCCESS */}

        {isSuccessful && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>
              ✓
            </Text>

            <Text style={styles.successTitle}>
              Order confirmed!
            </Text>

            <Text style={styles.successText}>
              Your payment was successful and your order
              has been confirmed.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                router.replace({
                  pathname: "/orders/[id]",
                  params: {
                    id: String(numericOrderId),
                  },
                })
              }
            >
              <Text style={styles.primaryButtonText}>
                View Order
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.secondaryButtonText}>
                Back to Home
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeTitle}>
            Development payment
          </Text>

          <Text style={styles.demoNoticeText}>
            This version uses the backend's payment
            simulation endpoints. A real payment gateway
            can be integrated later.
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
    maxWidth: 700,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 60,
  },

  orderCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  orderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EAF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  orderIconText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "900",
  },

  orderInfo: {
    flex: 1,
  },

  orderLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  orderNumber: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },

  orderAmount: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },

  statusCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0D98B",
  },

  successStatusCard: {
    backgroundColor: "#ECF7ED",
    borderColor: "#B8DDBB",
  },

  failedStatusCard: {
    backgroundColor: "#FDEEEE",
    borderColor: "#E7B9B5",
  },

  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    textAlign: "center",
    lineHeight: 36,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "800",
  },

  statusText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  referenceText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },

  methods: {
    gap: 10,
  },

  methodCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F1F7FA",
  },

  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  methodEmoji: {
    fontSize: 22,
  },

  methodContent: {
    flex: 1,
  },

  methodTitle: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "800",
  },

  methodDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#AAB5BE",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  actionSection: {
    gap: 10,
    marginBottom: 20,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  failureButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D7AAA6",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  failureButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },

  successContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#B8DDBB",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },

  successIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#E7F4E8",
    color: COLORS.success,
    textAlign: "center",
    lineHeight: 65,
    fontSize: 38,
    fontWeight: "900",
  },

  successTitle: {
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 15,
  },

  successText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 20,
    maxWidth: 450,
  },

  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  demoNotice: {
    backgroundColor: "#FFF9E8",
    borderWidth: 1,
    borderColor: "#EEDB9C",
    borderRadius: 12,
    padding: 14,
  },

  demoNoticeTitle: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },

  demoNoticeText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
});
