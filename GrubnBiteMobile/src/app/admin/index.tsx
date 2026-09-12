import RoleGuard from "@/components/RoleGuard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    adminTest,
    getMenuCategories,
    getMenuItems,
    getRestaurants,
} from "@/services/adminService";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  lightBlue: "#EAF5F9",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
  green: "#228B55",
  red: "#C83C3C",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [restaurantCount, setRestaurantCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [menuItemCount, setMenuItemCount] = useState(0);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      await adminTest();

      setAuthorized(true);

      const [restaurants, categories, menuItems] = await Promise.all([
        getRestaurants(),
        getMenuCategories(),
        getMenuItems(),
      ]);

      setRestaurantCount(restaurants.length);
      setCategoryCount(categories.length);
      setMenuItemCount(menuItems.length);
    } catch (err) {
      console.error(err);

      setAuthorized(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Admin access required</Text>

        <Text style={styles.errorText}>
          Your account does not currently have access to the admin area.
        </Text>

        {error ? <Text style={styles.errorDetails}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={() => router.replace("/")}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
     <RoleGuard allowedRoles={["admin"]}>
<ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage the GrubnBite platform
          </Text>
        </View>

        <Pressable
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Restaurants"
          value={restaurantCount}
          icon="🍽️"
        />

        <StatCard
          title="Categories"
          value={categoryCount}
          icon="📂"
        />

        <StatCard
          title="Menu Items"
          value={menuItemCount}
          icon="🍽️"
        />
      </View>

      <Text style={styles.sectionTitle}>Management</Text>

      <AdminAction
        title="Restaurants"
        description="Add, edit, open, close and remove restaurants."
        icon="🍽️"
        onPress={() => router.push("/admin/restaurants")}
      />

      <AdminAction
        title="Menu Management"
        description="Manage menu categories and menu items."
        icon="📋"
        onPress={() => router.push("/admin/menu")}
      />

      <AdminAction
        title="Orders"
        description="View restaurant orders where supported by the backend."
        icon="📦"
        onPress={() => router.push("/admin/orders")}
      />

      <AdminAction
        title="Drivers"
        description="Driver administration will be connected when the backend exposes a driver listing endpoint."
        icon="🚗"
        onPress={() => router.push("/admin/drivers")}
      />
    </ScrollView>
     </RoleGuard>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function AdminAction({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>{icon}</Text>
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
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

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
  },

  subtitle: {
    marginTop: 6,
    color: "#D9E6ED",
    fontSize: 14,
  },

  homeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },

  homeButtonText: {
    color: COLORS.navy,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    fontSize: 24,
  },

  statValue: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.navy,
  },

  statTitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },

  actionIconText: {
    fontSize: 24,
  },

  actionContent: {
    flex: 1,
    marginLeft: 14,
  },

  actionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  actionDescription: {
    marginTop: 4,
    color: COLORS.muted,
    lineHeight: 19,
  },

  arrow: {
    fontSize: 28,
    color: COLORS.blue,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.red,
    textAlign: "center",
  },

  errorText: {
    marginTop: 10,
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 21,
  },

  errorDetails: {
    marginTop: 12,
    textAlign: "center",
    color: COLORS.red,
    fontSize: 12,
  },

  primaryButton: {
    marginTop: 24,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },
});