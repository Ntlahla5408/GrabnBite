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
import { apiRequest } from "../services/api";

interface OrderItem {
  orderItemId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  orderId: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  userId: number;
  restaurantId: number;
  deliveryAddressId: number;
  orderItems: OrderItem[];
}

export default function OrderScreen() {
  const { token } = useAuth();

  const params = useLocalSearchParams<{
    orderId?: string;
  }>();

  const orderId = Number(params.orderId);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
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

    loadOrder();
  }, [token, orderId]);

  async function loadOrder() {
    if (!token || !orderId) return;

    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(`/api/Orders/${orderId}`, {}, token);

      console.log("ORDER RESULT:", result);

      setOrder(result);
    } catch (error) {
      console.error("Failed to load order:", error);

      setError("Unable to load your order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading your order...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Order unavailable</Text>

        <Text style={styles.errorText}>
          {error || "We could not find this order."}
        </Text>

        <Pressable style={styles.button} onPress={loadOrder}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>

        <Pressable
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const status = order.status.toUpperCase();

  const statusSteps = [
    {
      key: "PENDING",
      title: "Order placed",
      description: "Your order has been received.",
    },
    {
      key: "ACCEPTED",
      title: "Restaurant accepted",
      description: "The restaurant has accepted your order.",
    },
    {
      key: "PREPARING",
      title: "Preparing your order",
      description: "Your food is being prepared.",
    },
    {
      key: "READY",
      title: "Ready for pickup",
      description: "Your order is ready for collection.",
    },
    {
      key: "OUT_FOR_DELIVERY",
      title: "On the way",
      description: "Your order is on its way to you.",
    },
    {
      key: "DELIVERED",
      title: "Delivered",
      description: "Your order has been delivered.",
    },
  ];

  const statusOrder = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  const currentIndex = statusOrder.indexOf(status);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>Order #{order.orderId}</Text>

            <Text style={styles.headerSubtitle}>Track your order</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>
            {status === "DELIVERED" ? "✓" : "🍔"}
          </Text>

          <Text style={styles.statusTitle}>
            {status === "PENDING"
              ? "Order Confirmed"
              : status === "ACCEPTED"
                ? "Restaurant Accepted"
                : status === "PREPARING"
                  ? "Preparing Your Order"
                  : status === "READY"
                    ? "Ready for Pickup"
                    : status === "OUT_FOR_DELIVERY"
                      ? "On the Way"
                      : status === "DELIVERED"
                        ? "Order Delivered"
                        : "Order Received"}
          </Text>

          <Text style={styles.statusDescription}>
            {status === "PENDING"
              ? "Your order has been received and is waiting for the restaurant."
              : status === "DELIVERED"
                ? "Enjoy your meal!"
                : "We'll keep you updated as your order progresses."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          {statusSteps.map((step, index) => {
            const isCompleted = currentIndex >= index;

            const isCurrent = currentIndex === index;

            return (
              <View key={step.key} style={styles.statusRow}>
                <View style={styles.timeline}>
                  <View
                    style={[
                      styles.statusCircle,
                      isCompleted && styles.statusCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusCircleText,
                        isCompleted && styles.statusCircleTextActive,
                      ]}
                    >
                      {isCompleted ? "✓" : ""}
                    </Text>
                  </View>

                  {index < statusSteps.length - 1 && (
                    <View
                      style={[
                        styles.line,
                        currentIndex > index && styles.lineActive,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.statusContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCurrent && styles.stepTitleCurrent,
                    ]}
                  >
                    {step.title}
                  </Text>

                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Order</Text>

          {order.orderItems.map((item) => (
            <View key={item.orderItemId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.quantity}>{item.quantity}×</Text>

                <View>
                  <Text style={styles.itemName}>{item.menuItemName}</Text>

                  <Text style={styles.unitPrice}>
                    R{item.unitPrice.toFixed(2)} each
                  </Text>
                </View>
              </View>

              <Text style={styles.itemPrice}>R{item.subtotal.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.totalAmount}>
              R{order.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>

          <Text style={styles.deliveryText}>
            Delivery address #{order.deliveryAddressId}
          </Text>

          <Text style={styles.deliverySubtext}>
            Your selected delivery address
          </Text>
        </View>

        <Pressable
          style={styles.homeButtonLarge}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#F7F8FA",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 10,
  },

  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    fontSize: 32,
    color: "#071B2C",
    lineHeight: 34,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#071B2C",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#777",
    fontSize: 14,
  },

  statusCard: {
    backgroundColor: "#071B2C",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 18,
  },

  statusIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  statusDescription: {
    color: "#D8E0E6",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 20,
  },

  statusRow: {
    flexDirection: "row",
    minHeight: 70,
  },

  timeline: {
    width: 35,
    alignItems: "center",
  },

  statusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#D5D9DD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  statusCircleActive: {
    backgroundColor: "#F28C28",
    borderColor: "#F28C28",
  },

  statusCircleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  statusCircleTextActive: {
    color: "#FFFFFF",
  },

  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E0E3E6",
    marginVertical: 3,
  },

  lineActive: {
    backgroundColor: "#F28C28",
  },

  statusContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 18,
  },

  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#777",
  },

  stepTitleCurrent: {
    color: "#071B2C",
  },

  stepDescription: {
    color: "#999",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  quantity: {
    color: "#F28C28",
    fontWeight: "800",
    width: 35,
  },

  itemName: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
  },

  unitPrice: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },

  itemPrice: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 5,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#071B2C",
  },

  totalAmount: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F28C28",
  },

  deliveryText: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
  },

  deliverySubtext: {
    color: "#888",
    fontSize: 13,
    marginTop: 5,
  },

  button: {
    backgroundColor: "#F28C28",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  homeButton: {
    marginTop: 15,
    padding: 10,
  },

  homeText: {
    color: "#1A4B6B",
    fontWeight: "600",
  },

  homeButtonLarge: {
    backgroundColor: "#F28C28",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 5,
  },

  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
