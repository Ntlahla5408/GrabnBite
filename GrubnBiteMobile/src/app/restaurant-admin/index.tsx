import { useFocusEffect, useRouter } from "expo-router";
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

import {
    AdminRestaurant,
    getRestaurantMenu,
    getRestaurantOrders,
    getRestaurants,
    MenuItem,
    RestaurantOrder,
} from "@/services/restaurantAdminService";

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";

  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function RestaurantDashboard() {
  const router = useRouter();

  const [restaurant, setRestaurant] =
    useState<AdminRestaurant | null>(null);

  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setError("");

      const restaurants = await getRestaurants();

      if (!restaurants || restaurants.length === 0) {
        setError(
          "No restaurant is associated with this account.",
        );
        return;
      }

      /*
       * If the backend returns only the authenticated
       * restaurant, this works immediately.
       *
       * If multiple restaurants are returned, the first one
       * is used for now. We can add proper restaurant-user
       * selection once the backend exposes that relationship.
       */
      const currentRestaurant = restaurants[0];

      setRestaurant(currentRestaurant);

      const [restaurantOrders, restaurantMenu] =
        await Promise.all([
          getRestaurantOrders(currentRestaurant.id),
          getRestaurantMenu(currentRestaurant.id),
        ]);

      setOrders(restaurantOrders);
      setMenuItems(restaurantMenu);
    } catch (err) {
      console.error("Failed to load restaurant dashboard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load restaurant dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading restaurant dashboard...
        </Text>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Restaurant Dashboard
        </Text>

        <Text style={styles.errorText}>
          {error || "Restaurant information unavailable."}
        </Text>

        <Pressable style={styles.button} onPress={loadDashboard}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const pendingOrders = orders.filter((order) => {
    const status = order.status?.toLowerCase() ?? "";

    return (
      status.includes("pending") ||
      status.includes("new")
    );
  });

  const activeOrders = orders.filter((order) => {
    const status = order.status?.toLowerCase() ?? "";

    return (
      !status.includes("complete") &&
      !status.includes("deliver") &&
      !status.includes("cancel") &&
      !status.includes("reject")
    );
  });

  const unavailableItems = menuItems.filter(
    (item) => !item.isAvailable,
  );

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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          RESTAURANT MANAGEMENT
        </Text>

        <Text style={styles.title}>
          {restaurant.name}
        </Text>

        <Text style={styles.subtitle}>
          Manage your restaurant, orders and menu.
        </Text>
      </View>

      <View style={styles.openCard}>
        <View>
          <Text style={styles.openLabel}>
            Restaurant status
          </Text>

          <Text style={styles.openStatus}>
            {restaurant.isOpen ? "Open" : "Closed"}
          </Text>
        </View>

        <View
          style={[
            styles.statusDot,
            restaurant.isOpen
              ? styles.openDot
              : styles.closedDot,
          ]}
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🛎️</Text>
          <Text style={styles.statNumber}>
            {orders.length}
          </Text>
          <Text style={styles.statLabel}>
            Total Orders
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏳</Text>
          <Text style={styles.statNumber}>
            {pendingOrders.length}
          </Text>
          <Text style={styles.statLabel}>
            Pending
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🍽️</Text>
          <Text style={styles.statNumber}>
            {menuItems.length}
          </Text>
          <Text style={styles.statLabel}>
            Menu Items
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>
            {unavailableItems.length}
          </Text>
          <Text style={styles.statLabel}>
            Unavailable
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionCard}
          onPress={() =>
            router.push("/restaurant-admin/orders")
          }
        >
          <Text style={styles.actionIcon}>📋</Text>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Manage Orders
            </Text>

            <Text style={styles.actionDescription}>
              View and update incoming orders.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() =>
            router.push("/restaurant-admin/menu")
          }
        >
          <Text style={styles.actionIcon}>🍽️</Text>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Manage Menu
            </Text>

            <Text style={styles.actionDescription}>
              Add, edit and manage menu items.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() =>
            router.push("/restaurant-admin/categories")
          }
        >
          <Text style={styles.actionIcon}>🏷️</Text>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Categories
            </Text>

            <Text style={styles.actionDescription}>
              Organise your restaurant menu.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Recent Orders
      </Text>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>

          <Text style={styles.emptyTitle}>
            No active orders
          </Text>

          <Text style={styles.emptyText}>
            New customer orders will appear here.
          </Text>
        </View>
      ) : (
        activeOrders.slice(0, 5).map((order) => (
          <Pressable
            key={order.id}
            style={styles.orderCard}
            onPress={() =>
              router.push("/restaurant-admin/orders")
            }
          >
            <View>
              <Text style={styles.orderTitle}>
                Order #{order.id}
              </Text>

              <Text style={styles.orderStatus}>
                {formatStatus(order.status)}
              </Text>
            </View>

            <Text style={styles.orderArrow}>→</Text>
          </Pressable>
        ))
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

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2C7A9E",
    letterSpacing: 1,
  },

  title: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 5,
    color: "#64748B",
  },

  openCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  openLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  openStatus: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  openDot: {
    backgroundColor: "#22C55E",
  },

  closedDot: {
    backgroundColor: "#EF4444",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statIcon: {
    fontSize: 22,
  },

  statNumber: {
    marginTop: 8,
    fontSize: 25,
    fontWeight: "800",
    color: "#071B2C",
  },

  statLabel: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 13,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  actions: {
    gap: 10,
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  actionIcon: {
    fontSize: 27,
    marginRight: 14,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#071B2C",
  },

  actionDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 13,
  },

  arrow: {
    fontSize: 22,
    color: "#2C7A9E",
    fontWeight: "700",
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  orderTitle: {
    fontWeight: "800",
    color: "#071B2C",
  },

  orderStatus: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },

  orderArrow: {
    fontSize: 20,
    color: "#2C7A9E",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    marginTop: 10,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 5,
    color: "#64748B",
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
  },

  button: {
    marginTop: 18,
    backgroundColor: "#071B2C",
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});