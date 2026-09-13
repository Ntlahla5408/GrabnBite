import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import RoleGuard from "@/components/RoleGuard";
import { FoodColors } from "@/constants/theme";
import {
    getOrder,
    getOrderStatusHistory,
    type Order,
    type OrderStatusHistory,
} from "@/services/orderService";

const COLORS = {
  navy: FoodColors.oat,
  blue: FoodColors.tomato,
  white: "#FFFFFF",
  background: "#FFF9F4",
  text: "#1B1F22",
  muted: "#6E6A66",
  border: "#E8DDD5",
  green: FoodColors.green,
  red: FoodColors.tomatoDark,
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [id]),
  );

  const loadOrder = async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      if (!refreshing) {
        setLoading(true);
      }

      const orderId = Number(id);

      const [orderData, historyData] = await Promise.all([
        getOrder(orderId),
        getOrderStatusHistory(orderId).catch(() => []),
      ]);

      setOrder(orderData);
      setHistory(historyData ?? []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Unable to load this order.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadOrder();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loading}>Loading order...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load order</Text>
        <Text style={styles.errorText}>{error || "Order not found."}</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const restaurantName =
    order.restaurant?.name ??
    (order.restaurantId ? `Restaurant #${order.restaurantId}` : "Restaurant");

  const items = order.orderItems ?? order.items ?? [];

  const subtotal =
    order.subtotal ??
    items.reduce((sum, item) => {
      const unitPrice =
        item.unitPrice ?? item.price ?? item.menuItem?.price ?? 0;

      return sum + unitPrice * item.quantity;
    }, 0);

  const deliveryFee = order.deliveryFee ?? 0;

  const total = order.totalAmount ?? order.total ?? subtotal + deliveryFee;

  const deliveryId = order.deliveryId ?? order.delivery?.id;

  const currentStatus = order.status ?? "Unknown";

  const canTrack =
    deliveryId !== undefined &&
    !currentStatus.toLowerCase().includes("cancel") &&
    !currentStatus.toLowerCase().includes("complete") &&
    !currentStatus.toLowerCase().includes("deliver");

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
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ My Orders</Text>
          </Pressable>

          <Text style={styles.title}>Order #{order.id}</Text>

          <Text style={styles.subtitle}>{restaurantName}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current status</Text>

          <Text style={styles.statusValue}>{currentStatus}</Text>

          {order.createdAt ? (
            <Text style={styles.date}>
              Placed {new Date(order.createdAt).toLocaleString()}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={styles.paymentButton}
          onPress={() =>
            router.push({
              pathname: "/payment",
              params: { orderId: String(order.id) },
            })
          }
        >
          <Text style={styles.paymentButtonText}>Continue to payment</Text>
        </Pressable>

        {deliveryId !== undefined && canTrack ? (
          <Pressable
            style={styles.trackButton}
            onPress={() =>
              router.push({
                pathname: "/orders/[id]/tracking",
                params: {
                  id: String(order.id),
                  deliveryId: String(deliveryId),
                },
              })
            }
          >
            <Text style={styles.trackIcon}>🚗</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle}>Track your delivery</Text>
              <Text style={styles.trackSubtitle}>
                See the latest delivery location
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>

          {items.length === 0 ? (
            <Text style={styles.muted}>No item details available.</Text>
          ) : (
            items.map((item, index) => {
              const name =
                item.menuItem?.name ??
                `Menu item #${item.menuItemId ?? index + 1}`;

              const price =
                item.unitPrice ?? item.price ?? item.menuItem?.price ?? 0;

              return (
                <View
                  style={styles.item}
                  key={item.id ?? `${item.menuItemId}-${index}`}
                >
                  <View style={styles.quantity}>
                    <Text style={styles.quantityText}>{item.quantity}×</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{name}</Text>

                    <Text style={styles.itemPrice}>
                      R {Number(price).toFixed(2)} each
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    R {(price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>

          {order.deliveryAddress ? (
            <>
              {order.deliveryAddress.label ? (
                <Text style={styles.addressLabel}>
                  {order.deliveryAddress.label}
                </Text>
              ) : null}

              <Text style={styles.address}>
                {order.deliveryAddress.streetAddress}
              </Text>

              <Text style={styles.address}>
                {order.deliveryAddress.city}, {order.deliveryAddress.province}
              </Text>

              <Text style={styles.address}>
                {order.deliveryAddress.postalCode}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>
              Delivery address details are not available.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment summary</Text>

          <SummaryRow
            label="Subtotal"
            value={`R ${Number(subtotal).toFixed(2)}`}
          />

          <SummaryRow
            label="Delivery"
            value={
              order.deliveryFee !== undefined
                ? `R ${Number(deliveryFee).toFixed(2)}`
                : "Calculated"
            }
          />

          <View style={styles.totalDivider} />

          <SummaryRow
            label="Total"
            value={`R ${Number(total).toFixed(2)}`}
            bold
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order progress</Text>

          {history.length === 0 ? (
            <Text style={styles.muted}>
              No status history is available yet.
            </Text>
          ) : (
            history.map((entry, index) => (
              <View
                style={styles.historyRow}
                key={entry.id ?? `${entry.status}-${index}`}
              >
                <View style={styles.timelineDot} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.historyStatus}>
                    {entry.status ?? "Status update"}
                  </Text>

                  {(entry.createdAt ?? entry.timestamp) ? (
                    <Text style={styles.historyDate}>
                      {new Date(
                        entry.createdAt ?? entry.timestamp!,
                      ).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </RoleGuard>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.bold]}>{label}</Text>

      <Text style={[styles.summaryValue, bold && styles.bold]}>{value}</Text>
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
    padding: 24,
    backgroundColor: COLORS.background,
  },

  loading: {
    marginTop: 10,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingTop: 24,
  },

  back: {
    color: COLORS.blue,
    fontWeight: "700",
    marginBottom: 12,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.muted,
    marginTop: 5,
  },

  statusCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },

  statusValue: {
    marginTop: 6,
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.blue,
  },

  paymentButton: {
    marginHorizontal: 20,
    marginBottom: 5,
    backgroundColor: COLORS.blue,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  paymentButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  date: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 12,
  },

  trackButton: {
    marginHorizontal: 20,
    marginBottom: 5,
    backgroundColor: COLORS.blue,
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  trackIcon: {
    fontSize: 30,
    marginRight: 13,
  },

  trackTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  trackSubtitle: {
    marginTop: 3,
    color: "#FFE1D5",
    fontSize: 12,
  },

  arrow: {
    color: COLORS.white,
    fontSize: 28,
  },

  section: {
    backgroundColor: COLORS.white,
    margin: 20,
    marginBottom: 0,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 15,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  quantity: {
    width: 38,
  },

  quantityText: {
    color: COLORS.blue,
    fontWeight: "900",
  },

  itemName: {
    color: COLORS.text,
    fontWeight: "800",
  },

  itemPrice: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 12,
  },

  itemTotal: {
    color: COLORS.navy,
    fontWeight: "900",
    marginLeft: 10,
  },

  addressLabel: {
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 7,
  },

  address: {
    color: COLORS.muted,
    lineHeight: 21,
  },

  muted: {
    color: COLORS.muted,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  summaryLabel: {
    color: COLORS.muted,
  },

  summaryValue: {
    color: COLORS.text,
    fontWeight: "700",
  },

  bold: {
    color: COLORS.navy,
    fontWeight: "900",
  },

  totalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.blue,
    marginTop: 4,
    marginRight: 12,
  },

  historyStatus: {
    color: COLORS.text,
    fontWeight: "800",
  },

  historyDate: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
  },

  errorTitle: {
    color: COLORS.red,
    fontSize: 22,
    fontWeight: "900",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.muted,
  },

  primaryButton: {
    marginTop: 22,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 11,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },
});
