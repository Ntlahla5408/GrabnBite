import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  getRestaurantOrders,
  getRestaurants,
  RestaurantOrder,
  updateRestaurantOrderStatus,
} from "@/services/restaurantAdminService";

const statuses = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Completed",
  "Rejected",
];

const formatDate = (date?: string) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString();
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";

  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function RestaurantOrdersScreen() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setError("");

      const restaurants = await getRestaurants();

      if (restaurants.length === 0) {
        setError("No restaurant was found.");
        return;
      }

      const result = await getRestaurantOrders(
        restaurants[0].id,
      );

      setOrders(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load restaurant orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateStatus = async (
    orderId: number,
    status: string,
  ) => {
    try {
      setUpdating(orderId);

      const updated = await updateRestaurantOrderStatus(
        orderId,
        status,
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? updated : order,
        ),
      );
    } catch (err) {
      console.error("Failed to update order:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>
          Loading restaurant orders...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <Text style={styles.title}>Restaurant Orders</Text>

      <Text style={styles.subtitle}>
        Review incoming orders and update their status.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>
            No orders found
          </Text>
        </View>
      ) : (
        orders.map((order) => {
          const items =
            order.orderItems ?? order.items ?? [];

          const total =
            order.totalAmount ?? order.total ?? 0;

          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>
                    Order #{order.id}
                  </Text>

                  {order.createdAt || order.orderDate ? (
                    <Text style={styles.date}>
                      {formatDate(
                        order.createdAt ?? order.orderDate,
                      )}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.currentStatus}>
                  <Text style={styles.currentStatusText}>
                    {formatStatus(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>
                Items
              </Text>

              {items.length === 0 ? (
                <Text style={styles.muted}>
                  No item details returned.
                </Text>
              ) : (
                items.map((item, index) => (
                  <View
                    key={item.id ?? index}
                    style={styles.itemRow}
                  >
                    <Text style={styles.itemName}>
                      {item.quantity} ×{" "}
                      {item.menuItem?.name ??
                        `Item #${item.menuItemId}`}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.total}>
                  R {total.toFixed(2)}
                </Text>
              </View>

              {order.deliveryAddress ? (
                <View style={styles.addressBox}>
                  <Text style={styles.sectionLabel}>
                    Delivery Address
                  </Text>

                  <Text style={styles.address}>
                    {order.deliveryAddress.streetAddress}
                  </Text>

                  <Text style={styles.muted}>
                    {order.deliveryAddress.city},{" "}
                    {order.deliveryAddress.province}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>
                Update Status
              </Text>

              <View style={styles.statusOptions}>
                {statuses.map((status) => {
                  const active =
                    order.status?.toLowerCase() ===
                    status.toLowerCase();

                  return (
                    <Pressable
                      key={status}
                      disabled={updating === order.id}
                      style={[
                        styles.statusButton,
                        active &&
                          styles.statusButtonActive,
                      ]}
                      onPress={() =>
                        updateStatus(order.id, status)
                      }
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          active &&
                            styles.statusButtonTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {updating === order.id ? (
                <ActivityIndicator
                  style={styles.updating}
                />
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 5,
    color: "#64748B",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  orderNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
  },

  date: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },

  currentStatus: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  currentStatusText: {
    color: "#1E3A8A",
    fontWeight: "700",
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 7,
  },

  itemRow: {
    paddingVertical: 4,
  },

  itemName: {
    color: "#1E293B",
  },

  totalRow: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontWeight: "700",
    color: "#334155",
  },

  total: {
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
  },

  addressBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
  },

  address: {
    color: "#334155",
  },

  muted: {
    color: "#64748B",
    fontSize: 13,
  },

  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statusButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  statusButtonActive: {
    backgroundColor: "#071B2C",
    borderColor: "#071B2C",
  },

  statusButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },

  statusButtonTextActive: {
    color: "#FFFFFF",
  },

  updating: {
    marginTop: 12,
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 13,
    borderRadius: 10,
    marginBottom: 14,
  },

  errorText: {
    color: "#991B1B",
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loading: {
    marginTop: 10,
    color: "#64748B",
  },
});