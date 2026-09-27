import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";

interface AdminUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }

    loadUsers();
  }, [user]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/Users", {}, token);

      setUsers(data);
    } catch (err) {
      console.error("Failed to load admin users:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ],
    );
  }

  const userCount = users.length;

  const restaurantCount = users.filter(
    (user) => user.role === "Restaurant",
  ).length;

  const driverCount = users.filter(
    (user) => user.role === "Driver",
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "Customer",
  ).length;

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>

          <Text style={styles.headerSubtitle}>
            Welcome back, {user.firstName}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F97316" />

            <Text style={styles.loadingText}>
              Loading dashboard...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadUsers}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Dashboard */}
        {!loading && error === "" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>

              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Users"
                  value={userCount}
                />

                <StatCard
                  title="Customers"
                  value={customerCount}
                />

                <StatCard
                  title="Restaurants"
                  value={restaurantCount}
                />

                <StatCard
                  title="Drivers"
                  value={driverCount}
                />
              </View>
            </View>

            {/* Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Management</Text>

              <DashboardButton
                title="User Management"
                subtitle="View and manage customer, restaurant, driver and admin accounts."
                onPress={() => router.push("/admin-users")}
              />

              <DashboardButton
                title="Restaurants"
                subtitle="Manage restaurants and restaurant-related information."
                onPress={() => router.push("/admin-restaurants")}
              />

              <DashboardButton
                title="Drivers"
                subtitle="View and manage GrabnBite Drivers."
                onPress={() => router.push("/admin-drivers")}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function DashboardButton({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dashboardButton,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.dashboardButtonContent}>
        <Text style={styles.dashboardButtonTitle}>{title}</Text>

        <Text style={styles.dashboardButtonSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    marginTop: 5,
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  logoutText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },

  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    color: "#071B2C",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    minWidth: 180,
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statValue: {
    color: "#071B2C",
    fontSize: 30,
    fontWeight: "800",
  },

  statTitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },

  dashboardButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dashboardButtonContent: {
    flex: 1,
    paddingRight: 15,
  },

  dashboardButtonTitle: {
    color: "#071B2C",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
  },

  dashboardButtonSubtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },

  arrow: {
    color: "#F97316",
    fontSize: 30,
    fontWeight: "300",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 25,
    marginTop: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.75,
  },
});