import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

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

const ACTIVE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

function getStatusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return "Order Placed";
    case "ACCEPTED":
      return "Accepted";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return "Ready";
    case "OUT_FOR_DELIVERY":
      return "On the Way";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "#2E7D32";

    case "CANCELLED":
      return "#D32F2F";

    case "OUT_FOR_DELIVERY":
      return "#1A4B6B";

    default:
      return "#F28C28";
  }
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setError("");

      const result = await apiRequest("/api/Orders/my-orders");

      console.log("MY ORDERS RESULT:", result);

      setOrders(result);
    } catch (error) {
      console.error("Failed to load orders:", error);

      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
  }

  function openOrder(orderId: number) {
    console.log("OPENING ORDER:", orderId);

    router.push({
      pathname: "/order",
      params: {
        orderId: orderId.toString(),
      },
    });
  }

  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUSES.includes(order.status.toUpperCase()),
  );

  const pastOrders = orders.filter(
    (order) => !ACTIVE_STATUSES.includes(order.status.toUpperCase()),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>My Orders</Text>

            <Text style={styles.subtitle}>
              View and track your GrabnBite orders
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load orders</Text>

            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.retryButton} onPress={loadOrders}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>

            <Text style={styles.emptyTitle}>No orders yet</Text>

            <Text style={styles.emptyText}>
              Your orders will appear here after you place your first order.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.shopButtonText}>Start Ordering</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Orders</Text>

                {activeOrders.map((order) => (
                  <Pressable
                    key={order.orderId}
                    style={styles.orderCard}
                    onPress={() => openOrder(order.orderId)}
                  >
                    <View style={styles.orderTop}>
                      <View>
                        <Text style={styles.orderNumber}>
                          Order #{order.orderId}
                        </Text>

                        <Text style={styles.orderDate}>
                          {new Date(order.orderDate).toLocaleString()}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(order.status),
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusLabel(order.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.itemsText}>
                      {order.orderItems.length}{" "}
                      {order.orderItems.length === 1 ? "item" : "items"}
                    </Text>

                    <View style={styles.orderBottom}>
                      <Text style={styles.totalLabel}>Total</Text>

                      <Text style={styles.totalAmount}>
                        R{order.totalAmount.toFixed(2)}
                      </Text>
                    </View>

                    <Text style={styles.trackText}>Tap to track order →</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {pastOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Orders</Text>

                {pastOrders.map((order) => (
                  <Pressable
                    key={order.orderId}
                    style={styles.orderCard}
                    onPress={() => openOrder(order.orderId)}
                  >
                    <View style={styles.orderTop}>
                      <View>
                        <Text style={styles.orderNumber}>
                          Order #{order.orderId}
                        </Text>

                        <Text style={styles.orderDate}>
                          {new Date(order.orderDate).toLocaleString()}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(order.status),
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusLabel(order.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.itemsText}>
                      {order.orderItems.length}{" "}
                      {order.orderItems.length === 1 ? "item" : "items"}
                    </Text>

                    <View style={styles.orderBottom}>
                      <Text style={styles.totalLabel}>Total</Text>

                      <Text style={styles.totalAmount}>
                        R{order.totalAmount.toFixed(2)}
                      </Text>
                    </View>

                    <Text style={styles.viewText}>View order details →</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <Pressable
          style={styles.homeButton}
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

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
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

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 3,
    color: "#777",
    fontSize: 14,
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 12,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  orderDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 15,
  },

  itemsText: {
    color: "#777",
    fontSize: 14,
  },

  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  totalLabel: {
    color: "#071B2C",
    fontWeight: "700",
  },

  totalAmount: {
    color: "#F28C28",
    fontSize: 18,
    fontWeight: "800",
  },

  trackText: {
    color: "#1A4B6B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 15,
  },

  viewText: {
    color: "#1A4B6B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 15,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    marginTop: 20,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    lineHeight: 20,
    marginTop: 8,
  },

  shopButton: {
    backgroundColor: "#F28C28",
    borderRadius: 12,
    paddingHorizontal: 25,
    paddingVertical: 13,
    marginTop: 20,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  errorTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: "#F28C28",
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 12,
    marginTop: 18,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  homeButton: {
    backgroundColor: "#071B2C",
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
