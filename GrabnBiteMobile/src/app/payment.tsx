import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { createYocoPayment } from "../services/paymentService";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";

export default function PaymentScreen() {
  const { token, loading: authLoading } = useAuth();
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { showError } = useErrorFeedback();
  const styles = createStyles(colors);

  const params = useLocalSearchParams<{
    orderId?: string;
    restaurantId?: string;
  }>();

  const orderId = Number(params.orderId);

  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [error, setError] = useState("");
  const [openingPayment, setOpeningPayment] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const checkoutOpenedRef = useRef(false);

  const startPayment = useCallback(async () => {
    if (!token || !Number.isInteger(orderId) || orderId <= 0) {
      setError("Please sign in and open a valid order to continue payment.");
      setLoading(false);
      return;
    }

    try {
      const result = await createYocoPayment(orderId, token);

      if (result.paymentStatus?.toUpperCase() === "PAID") {
        router.replace({
          pathname: "/payment-success",
          params: { orderId: String(orderId) },
        });
        return;
      }

      if (!result.redirectUrl) {
        throw new Error("Yoco did not return a secure checkout URL.");
      }

      setCheckoutUrl(result.redirectUrl);
      setError("");
    } catch (paymentError) {
      logAppError("Starting Yoco payment", paymentError);
      setError("We could not prepare the payment. Check your order status before trying again.");
      showError(getUserFacingError(paymentError, {
        title: "We could not prepare your payment",
        message: "Your order may already have a pending payment. Check the order status before attempting payment again.",
      }), () => {
        router.replace({ pathname: "/order", params: { orderId: String(orderId) } });
      });
    } finally {
      setLoading(false);
    }
  }, [token, orderId, showError]);

  useEffect(() => {
    if (
      authLoading ||
      !token ||
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return;
    }

    const paymentToken = token;
    let cancelled = false;

    async function initializePayment() {
      try {
        const result = await createYocoPayment(orderId, paymentToken);

        if (cancelled) {
          return;
        }

        if (result.paymentStatus?.toUpperCase() === "PAID") {
          router.replace({
            pathname: "/payment-success",
            params: { orderId: String(orderId) },
          });
          return;
        }

        if (!result.redirectUrl) {
          throw new Error("Yoco did not return a secure checkout URL.");
        }

        setCheckoutUrl(result.redirectUrl);
        setError("");
      } catch (paymentError) {
        if (!cancelled) {
          logAppError("Preparing Yoco payment", paymentError);
          setError("We could not prepare the payment. Check your order status before trying again.");
          showError(getUserFacingError(paymentError, {
            title: "We could not prepare your payment",
            message: "Your order may already have a pending payment. Check the order status before attempting payment again.",
          }), () => {
            router.replace({ pathname: "/order", params: { orderId: String(orderId) } });
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializePayment();

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, orderId, showError]);

  useEffect(() => {
    let previousAppState = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const returnedToApp =
        (previousAppState === "inactive" || previousAppState === "background") &&
        nextAppState === "active";

      previousAppState = nextAppState;

      // Some mobile browsers do not reliably open a custom-scheme link after
      // checkout. If the customer returns to this screen, verify with the API.
      if (returnedToApp && checkoutOpenedRef.current) {
        checkoutOpenedRef.current = false;
        router.replace({
          pathname: "/payment-success",
          params: { orderId: String(orderId) },
        });
      }
    });

    return () => subscription.remove();
  }, [orderId]);

  async function openPayment() {
    if (!checkoutUrl) {
      setError("The payment link is missing. Please try again.");
      return;
    }

    try {
      setOpeningPayment(true);
      setPaymentOpened(true);
      checkoutOpenedRef.current = true;
      setError("");

      // Linking opens Yoco in the device browser in Expo Go and native apps.
      await Linking.openURL(checkoutUrl);
    } catch (openError) {
      checkoutOpenedRef.current = false;
      setPaymentOpened(false);
      logAppError("Opening Yoco payment page", openError);
      setError("We could not open the secure payment page. Please check your connection and try again.");
      showError(getUserFacingError(openError, {
        title: "We could not open the payment page",
        message: "Your payment page did not open. Your order is still awaiting payment. Please check your connection and try again.",
        actionLabel: "Try again",
      }), () => { void openPayment(); });
    } finally {
      setOpeningPayment(false);
    }
  }

  const invalidPaymentInput =
    !authLoading && (!token || !Number.isInteger(orderId) || orderId <= 0);

  if (authLoading || (loading && !invalidPaymentInput)) {
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

  if (invalidPaymentInput || error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>!</Text>
        </View>

        <Text style={styles.errorTitle}>Payment could not start</Text>

        <Text style={styles.errorText}>
          {invalidPaymentInput
            ? "Please sign in and open a valid order to continue payment."
            : error}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => {
            if (!token || !Number.isInteger(orderId) || orderId <= 0) {
              setError("Please sign in and open a valid order to continue payment.");
              return;
            }

            setLoading(true);
            setError("");
            void startPayment();
          }}
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
          Your order has been created and is awaiting payment.
        </Text>

        <Text style={styles.description}>
          Continue to Yoco to complete your payment. Your order will not be marked as paid until the payment is verified.
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

        {paymentOpened ? (
          <Pressable
            onPress={() => {
              checkoutOpenedRef.current = false;
              router.replace({
                pathname: "/payment-success",
                params: { orderId: String(orderId) },
              });
            }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backText}>I&apos;ve returned — check payment</Text>
          </Pressable>
        ) : null}

        {/* Security */}
        <View style={styles.secureContainer}>
          <Text style={styles.secureIcon}>🔒</Text>

          <Text style={styles.secureText}>Secure payment powered by Yoco</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: (typeof AppThemeColors)[keyof typeof AppThemeColors]) {
  const themeErrorSurface = colors.background === AppThemeColors.dark.background ? "rgba(248, 113, 113, 0.10)" : "#FEF2F2";
  const themeErrorBorder = colors.background === AppThemeColors.dark.background ? "rgba(248, 113, 113, 0.25)" : "#FECACA";
  const themeErrorText = colors.background === AppThemeColors.dark.background ? "#FCA5A5" : "#B42318";
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 390,
    marginBottom: 4,
  },

  orderCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 26,
    marginBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  orderLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  orderNumber: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
  },

  orderDivider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },

  orderDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  payButton: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.accent,
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
    color: colors.text,
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
    color: colors.textSecondary,
    fontSize: 12,
  },

  loadingIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingIcon: {
    fontSize: 34,
  },

  loadingTitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  loadingText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: themeErrorSurface,
    borderWidth: 1,
    borderColor: themeErrorBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorIcon: {
    color: themeErrorText,
    fontSize: 32,
    fontWeight: "800",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
    textAlign: "center",
  },

  errorText: {
    color: themeErrorText,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 380,
  },

  retryButton: {
    backgroundColor: colors.accent,
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
    color: colors.textSecondary,
    fontWeight: "600",
  },

  buttonPressed: {
    opacity: 0.7,
  },
  });
}
