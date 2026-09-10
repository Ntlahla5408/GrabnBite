import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { apiRequest } from "@/services/api";
import { getRestaurants, type Restaurant } from "@/services/adminService";

interface AdminOrder {
  id: number;
  restaurantId?: number;
  status?: string;
  totalAmount?: number;
  total?: number;
  createdAt?: string;
  deliveryAddressId?: number;
}

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const restaurantData = await getRestaurants();
      setRestaurants(restaurantData);

      const responses = await Promise.all(
        restaurantData.map(async (restaurant) => {
          try {
            return await apiRequest<AdminOrder[]>(
              `/api/Order/restaurant/${restaurant.id}`,
            );
          } catch {
            return [];
          }
        }),
      );

      const combined = responses
        .flat()
        .sort((a, b) => {
          const dateA = a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;

          const dateB = b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;

          return dateB - dateA;
        });

      setOrders(combined);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const restaurantName = (restaurantId?: number) => {
    return (
      restaurants.find((restaurant) => restaurant.id === restaurantId)?.name ??
      "Restaurant"
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loading}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Admin</Text>
        </Pressable>

        <Text style={styles.title}>Orders</Text>

        <Text style={styles.subtitle}>
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptyText}>
            There are currently no orders available through the restaurant
            order endpoints.
          </Text>
        </View>
      ) : (
        orders.map((order) => {
          const total = order.totalAmount ?? order.total ?? 0;

          return (
            <View style={styles.card} key={order.id}>
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.orderId}>Order #{order.id}</Text>

                  <Text style={styles.restaurant}>
                    {restaurantName(order.restaurantId)}
                  </Text>
                </View>

                <View style={styles.status}>
                  <Text style={styles.statusText}>
                    {order.status ?? "Unknown"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.total}>
                  R {Number(total).toFixed(2)}
                </Text>
              </View>

              {order.createdAt ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Created</Text>
                  <Text style={styles.value}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </View>
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
    backgroundColor: COLORS.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loading: {
    marginTop: 10,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 20,
    paddingTop: 24,
  },

  back: {
    color: "#D9E6ED",
    fontWeight: "700",
    marginBottom: 12,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#D9E6ED",
    marginTop: 5,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  orderId: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.navy,
  },

  restaurant: {
    marginTop: 5,
    color: COLORS.muted,
  },

  status: {
    backgroundColor: "#EAF5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  label: {
    color: COLORS.muted,
  },

  value: {
    color: COLORS.text,
    maxWidth: "65%",
    textAlign: "right",
  },

  total: {
    color: COLORS.navy,
    fontWeight: "900",
  },

  emptyBox: {
    alignItems: "center",
    padding: 40,
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});