import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  getMyOrders,
  type Order,
} from "@/services/orderService";
import RoleGuard from "@/components/RoleGuard";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
  green: "#228B55",
  red: "#C83C3C",
  orange: "#D97917",
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, []),
  );

  const loadOrders = async () => {
    try {
      setError("");

      if (!refreshing) {
        setLoading(true);
      }

      const data = await getMyOrders();
      setOrders(data ?? []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={["customer", "user"]}>
<ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={COLORS.blue}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>

        <Text style={styles.subtitle}>
          View your orders and track deliveries
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>

          <Text style={styles.emptyTitle}>No orders yet</Text>

          <Text style={styles.emptyText}>
            Once you place an order, it will appear here.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryButtonText}>
              Browse Restaurants
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.ordersContainer}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() =>
                router.push({
                  pathname: "/orders/[id]",
                  params: { id: String(order.id) },
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
    </RoleGuard>
    
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const restaurantName =
    order.restaurant?.name ??
    (order.restaurantId
      ? `Restaurant #${order.restaurantId}`
      : "Restaurant");

  const total = order.totalAmount ?? order.total ?? 0;

  const itemList = order.orderItems ?? order.items ?? [];

  const itemCount = itemList.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0,
  );

  const status = order.status ?? "Unknown";

  return (
    <Pressable style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.restaurantName}>
            {restaurantName}
          </Text>

          <Text style={styles.orderNumber}>
            Order #{order.id}
          </Text>
        </View>

        <StatusBadge status={status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.orderInfo}>
        <View>
          <Text style={styles.infoLabel}>Items</Text>
          <Text style={styles.infoValue}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </Text>
        </View>

        <View>
          <Text style={styles.infoLabel}>Total</Text>
          <Text style={styles.total}>
            R {Number(total).toFixed(2)}
          </Text>
        </View>
      </View>

      {order.createdAt ? (
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleString()}
        </Text>
      ) : null}

      <View style={styles.viewOrder}>
        <Text style={styles.viewOrderText}>
          View order →
        </Text>
      </View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let background = "#EAF5F9";
  let text = COLORS.blue;

  if (
    normalized.includes("deliver") ||
    normalized.includes("complete") ||
    normalized.includes("success")
  ) {
    background = "#E7F6ED";
    text = COLORS.green;
  } else if (
    normalized.includes("cancel") ||
    normalized.includes("fail")
  ) {
    background = "#FCEAEA";
    text = COLORS.red;
  } else if (
    normalized.includes("pending") ||
    normalized.includes("prepar")
  ) {
    background = "#FFF3E5";
    text = COLORS.orange;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: background }]}>
      <Text style={[styles.statusText, { color: text }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 24,
  },

  title: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: "900",
  },

  subtitle: {
    color: "#D9E6ED",
    marginTop: 6,
  },

  ordersContainer: {
    padding: 20,
  },

  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
  },

  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },

  orderNumber: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 13,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },

  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  infoValue: {
    marginTop: 3,
    color: COLORS.text,
    fontWeight: "700",
  },

  total: {
    marginTop: 3,
    color: COLORS.navy,
    fontWeight: "900",
  },

  date: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 12,
  },

  viewOrder: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  viewOrderText: {
    color: COLORS.blue,
    fontWeight: "900",
  },

  empty: {
    padding: 45,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 55,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.navy,
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 21,
  },

  primaryButton: {
    marginTop: 24,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 11,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  errorBox: {
    margin: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#FCEAEA",
  },

  errorTitle: {
    fontWeight: "900",
    color: COLORS.red,
  },

  errorText: {
    marginTop: 6,
    color: COLORS.red,
  },

  retryButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: COLORS.red,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: "800",
  },
});