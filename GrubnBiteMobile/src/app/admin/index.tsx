import LogoutButton from "@/components/LogoutButton";
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
  getRestaurants,
} from "@/services/adminService";

const COLORS = {
  ink: "#101214",
  tomato: "#FF704B",
  lightTomato: "#FFE1D5",
  cream: "#FFFDF9",
  text: "#1E2024",
  muted: "#6E6A66",
  border: "#E8DED5",
  green: "#2F8F5B",
  red: "#C84A32",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [restaurantCount, setRestaurantCount] = useState(0);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const restaurants = await getRestaurants();

      setRestaurantCount(restaurants.length);
    } catch (err) {
      console.error(err);

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
        <View style={styles.exitRow}>
          <LogoutButton />
        </View>
        <ActivityIndicator size="large" color={COLORS.tomato} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage the GrubnBite platform</Text>
          </View>

          <View style={styles.headerActions}>
            <LogoutButton />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard title="Restaurants" value={restaurantCount} icon="🍽️" />
        </View>

        <Text style={styles.sectionTitle}>Management</Text>

        <AdminAction
          title="User Management"
          description="Update user roles and platform access."
          icon="👥"
          onPress={() => router.push("/admin/users")}
        />

        <AdminAction
          title="Restaurants"
          description="Add, edit, open, close and remove restaurants."
          icon="🍽️"
          onPress={() => router.push("/admin/restaurants")}
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
    backgroundColor: COLORS.cream,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.cream,
  },

  exitRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.ink,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.cream,
  },

  subtitle: {
    marginTop: 6,
    color: "#F4EEE7",
    fontSize: 14,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    color: COLORS.ink,
  },

  statTitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.ink,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: COLORS.cream,
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
    backgroundColor: COLORS.lightTomato,
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
    color: COLORS.tomato,
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
    backgroundColor: COLORS.tomato,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: COLORS.cream,
    fontWeight: "800",
  },
});
