import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getRestaurantOrders,
  updateRestaurantOrderStatus,
} from "@/services/restaurantDashboardService";

import { Order } from "@/services/orderService";
import RoleGuard from "@/components/RoleGuard";

const STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Rejected",
  "Cancelled",
];

export default function RestaurantOrders() {
  const params = useLocalSearchParams<{ restaurantId?: string }>();

  const restaurantId = Number(params.restaurantId);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!restaurantId) {
      setError("No restaurant was selected.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const data = await getRestaurantOrders(restaurantId);
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load restaurant orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const changeStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);

      const updatedOrder = await updateRestaurantOrderStatus(
        orderId,
        status,
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? { ...order, ...updatedOrder, status }
            : order,
        ),
      );
    } catch (err) {
      Alert.alert(
        "Could not update order",
        err instanceof Error
          ? err.message
          : "The order status could not be updated.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getOrderItems = (order: Order) => {
    return order.orderItems ?? order.items ?? [];
  };

  const getOrderTotal = (order: Order) => {
    if (typeof order.totalAmount === "number") {
      return order.totalAmount;
    }

    if (typeof order.total === "number") {
      return order.total;
    }

    return getOrderItems(order).reduce((sum, item) => {
      const price =
        item.totalPrice ??
        item.price ??
        item.unitPrice ??
        item.menuItem?.price ??
        0;

      return sum + price * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <RoleGuard
  allowedRoles={["restaurant", "restaurantstaff", "staff"]}
>
<View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#071B2C" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Restaurant Orders</Text>
          <Text style={styles.subtitle}>
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>

          <Pressable onPress={loadOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {orders.length === 0 && !error ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={60} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>
            New customer orders will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          contentContainerStyle={styles.list}
        >
          {orders.map((order) => {
            const items = getOrderItems(order);
            const total = getOrderTotal(order);

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>
                      Order #{order.id}
                    </Text>

                    <Text style={styles.orderDate}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "Date unavailable"}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {order.status || "Unknown"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {items.length > 0 ? (
                  items.map((item, index) => (
                    <View key={item.id ?? index} style={styles.itemRow}>
                      <Text style={styles.quantity}>
                        {item.quantity}×
                      </Text>

                      <Text style={styles.itemName}>
                        {item.menuItem?.name ||
                          `Menu item #${item.menuItemId ?? ""}`}
                      </Text>

                      <Text style={styles.itemPrice}>
                        R
                        {(
                          (item.totalPrice ??
                            item.price ??
                            item.unitPrice ??
                            item.menuItem?.price ??
                            0) * item.quantity
                        ).toFixed(2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noItems}>
                    Order item details unavailable.
                  </Text>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Order Total</Text>
                  <Text style={styles.totalValue}>
                    R{total.toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.statusHeading}>
                  Update Order Status
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statusList}
                >
                  {STATUSES.map((status) => {
                    const selected =
                      (order.status || "").toLowerCase() ===
                      status.toLowerCase();

                    const updating = updatingOrderId === order.id;

                    return (
                      <Pressable
                        key={status}
                        disabled={updating || selected}
                        onPress={() => changeStatus(order.id, status)}
                        style={[
                          styles.statusButton,
                          selected && styles.selectedStatusButton,
                          updating && styles.disabledButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            selected && styles.selectedStatusText,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
</RoleGuard>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
  },

  orderDate: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748B",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0369A1",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 15,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  quantity: {
    width: 30,
    fontWeight: "700",
    color: "#1A4B6B",
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#071B2C",
  },

  noItems: {
    color: "#64748B",
    fontSize: 13,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
    paddingTop: 15,
  },

  totalLabel: {
    fontWeight: "700",
    color: "#334155",
  },

  totalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  statusHeading: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "700",
    color: "#071B2C",
  },

  statusList: {
    gap: 8,
  },

  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  selectedStatusButton: {
    backgroundColor: "#1A4B6B",
    borderColor: "#1A4B6B",
  },

  disabledButton: {
    opacity: 0.6,
  },

  statusButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  selectedStatusText: {
    color: "#FFFFFF",
  },

  errorBox: {
    margin: 16,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorText: {
    marginTop: 7,
    color: "#991B1B",
  },

  retryText: {
    marginTop: 10,
    color: "#1A4B6B",
    fontWeight: "800",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
  },
});