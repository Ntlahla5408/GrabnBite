import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import {
  acceptRestaurantOrder,
  getRestaurantOrders,
  prepareRestaurantOrder,
  readyRestaurantOrder,
  RestaurantOrder,
} from "../services/restaurantOrderService";

const NAVY = "#071B2C";
const ORANGE = "#F28C28";
const BACKGROUND = "#F7F8FA";
const BLUE = "#1A4B6B";
const GREEN = "#2E7D32";

export default function RestaurantDashboardScreen() {
  const { user, token, loading: authLoading } = useAuth();

  // ALL STATE HOOKS
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  // EFFECTS / CALLBACK HOOKS
  useEffect(() => {
    if (!authLoading && user?.role !== "Restaurant") {
      router.replace("/");
    }
  }, [authLoading, user]);

  const loadOrders = async () => {
    if (!token) return;

    try {
      setError("");

      const data = await getRestaurantOrders(token);
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load restaurant orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && token && user?.role === "Restaurant") {
        loadOrders();
      }
    }, [authLoading, token, user?.role]),
  );

  // ONLY NOW can conditional returns happen

  if (authLoading) {
    return null;
  }

  if (!token || user?.role !== "Restaurant") {
    return null;
  }

  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const handleAction = async (order: RestaurantOrder) => {
    if (!token) return;

    try {
      setActionLoading(order.orderId);
      setError("");

      if (order.status === "PENDING") {
        await acceptRestaurantOrder(order.orderId, token);
      } else if (order.status === "ACCEPTED") {
        await prepareRestaurantOrder(order.orderId, token);
      } else if (order.status === "PREPARING") {
        await readyRestaurantOrder(order.orderId, token);
      }

      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Unable to update the order.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingOrders = orders.filter((order) => order.status === "PENDING");

  const acceptedOrders = orders.filter((order) => order.status === "ACCEPTED");

  const preparingOrders = orders.filter(
    (order) => order.status === "PREPARING",
  );

  const readyOrders = orders.filter((order) => order.status === "READY");

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ORANGE} />

        <Text style={styles.loadingText}>Loading restaurant dashboard...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Restaurant login required</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSmall}>Restaurant Dashboard</Text>

          <Text style={styles.headerTitle}>Welcome back</Text>

          {user?.email ? (
            <Text style={styles.headerEmail}>{user.email}</Text>
          ) : null}
        </View>

        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🍴</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshOrders} />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <SummaryCard label="New" value={pendingOrders.length} />

          <SummaryCard
            label="Preparing"
            value={acceptedOrders.length + preparingOrders.length}
          />

          <SummaryCard label="Ready" value={readyOrders.length} />
        </View>

        {/* Menu Management */}
        <Pressable
          style={styles.menuManagementButton}
          onPress={() => router.push("/restaurant-menu")}
        >
          <View style={styles.menuManagementIcon}>
            <Text style={styles.menuManagementIconText}>☰</Text>
          </View>

          <View style={styles.menuManagementContent}>
            <Text style={styles.menuManagementTitle}>Manage Menu</Text>

            <Text style={styles.menuManagementSubtitle}>
              Add, edit, or remove menu items
            </Text>
          </View>

          <Text style={styles.menuManagementArrow}>→</Text>
        </Pressable>

        <OrderSection
          title="New Orders"
          orders={pendingOrders}
          actionLabel="Accept Order"
          actionColor={ORANGE}
          actionLoading={actionLoading}
          onAction={handleAction}
        />

        <OrderSection
          title="Accepted"
          orders={acceptedOrders}
          actionLabel="Start Preparing"
          actionColor={BLUE}
          actionLoading={actionLoading}
          onAction={handleAction}
        />

        <OrderSection
          title="Preparing"
          orders={preparingOrders}
          actionLabel="Mark Ready"
          actionColor={GREEN}
          actionLoading={actionLoading}
          onAction={handleAction}
        />

        <OrderSection
          title="Ready for Pickup"
          orders={readyOrders}
          actionLabel=""
          actionColor={GREEN}
          actionLoading={actionLoading}
          onAction={handleAction}
        />

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🍽️</Text>

            <Text style={styles.emptyTitle}>No orders yet</Text>

            <Text style={styles.emptyText}>
              New customer orders will appear here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function OrderSection({
  title,
  orders,
  actionLabel,
  actionColor,
  actionLoading,
  onAction,
}: {
  title: string;
  orders: RestaurantOrder[];
  actionLabel: string;
  actionColor: string;
  actionLoading: number | null;
  onAction: (order: RestaurantOrder) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <Text style={styles.sectionCount}>{orders.length}</Text>
      </View>

      {orders.length === 0 ? (
        <Text style={styles.noOrders}>No orders in this section.</Text>
      ) : (
        orders.map((order) => (
          <View key={order.orderId} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>Order #{order.orderId}</Text>

                <Text style={styles.orderDate}>
                  {formatDate(order.orderDate)}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {formatStatus(order.status)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {order.items.map((item) => (
              <View key={item.orderItemId} style={styles.itemRow}>
                <Text style={styles.quantity}>{item.quantity}×</Text>

                <Text style={styles.itemName} numberOfLines={1}>
                  {item.menuItemName}
                </Text>

                <Text style={styles.itemPrice}>
                  R{item.subtotal.toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalAmount}>
                R{order.totalAmount.toFixed(2)}
              </Text>
            </View>

            {actionLabel ? (
              <Pressable
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: actionColor,
                  },
                ]}
                disabled={actionLoading === order.orderId}
                onPress={() => onAction(order)}
              >
                {actionLoading === order.orderId ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>{actionLabel}</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.readyMessage}>
                <Text style={styles.readyMessageText}>
                  Waiting for driver pickup
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "NEW";

    case "ACCEPTED":
      return "ACCEPTED";

    case "PREPARING":
      return "PREPARING";

    case "READY":
      return "READY";

    case "OUT_FOR_DELIVERY":
      return "OUT FOR DELIVERY";

    case "DELIVERED":
      return "DELIVERED";

    case "CANCELLED":
      return "CANCELLED";

    default:
      return status;
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerSmall: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  headerEmail: {
    color: "#D7E0E7",
    fontSize: 13,
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    fontSize: 24,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 2,
  },

  summaryValue: {
    fontSize: 25,
    fontWeight: "800",
    color: NAVY,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#66727D",
    marginTop: 3,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: NAVY,
  },

  sectionCount: {
    marginLeft: 8,
    backgroundColor: "#E6EBEF",
    color: NAVY,
    minWidth: 26,
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
  },

  noOrders: {
    color: "#7A858E",
    fontSize: 14,
    paddingVertical: 8,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: NAVY,
  },

  orderDate: {
    color: "#7A858E",
    fontSize: 12,
    marginTop: 4,
  },

  statusBadge: {
    backgroundColor: "#EEF2F5",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },

  statusText: {
    color: NAVY,
    fontSize: 10,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#E7EAED",
    marginVertical: 14,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  quantity: {
    width: 30,
    fontWeight: "700",
    color: ORANGE,
  },

  itemName: {
    flex: 1,
    color: "#27333D",
    fontSize: 14,
  },

  itemPrice: {
    color: NAVY,
    fontWeight: "600",
    fontSize: 14,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E7EAED",
    marginTop: 7,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    color: "#65717B",
    fontSize: 14,
  },

  totalAmount: {
    color: NAVY,
    fontSize: 17,
    fontWeight: "800",
  },

  actionButton: {
    marginTop: 16,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  readyMessage: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#EEF7EF",
    borderRadius: 10,
    alignItems: "center",
  },

  readyMessageText: {
    color: GREEN,
    fontWeight: "700",
    fontSize: 13,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    marginTop: 20,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: NAVY,
  },

  emptyText: {
    color: "#71808B",
    marginTop: 6,
    textAlign: "center",
  },

  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  errorText: {
    color: "#B42318",
    fontSize: 13,
  },

  center: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  loadingText: {
    marginTop: 12,
    color: "#66727D",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
    marginBottom: 18,
  },

  primaryButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 35,
    paddingVertical: 13,
    borderRadius: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  menuManagementButton: {
    backgroundColor: "#071B2C",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  menuManagementIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F47C20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  menuManagementIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  menuManagementContent: {
    flex: 1,
  },

  menuManagementTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  menuManagementSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 3,
  },

  menuManagementArrow: {
    color: "#fff",
    fontSize: 24,
    marginLeft: 10,
  },
});
