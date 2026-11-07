import {useCallback, useEffect, useState, useRef} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { useAuth } from "../context/authContext";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";
import { apiRequest } from "../services/api";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { Layout, Radius, Spacing, Typography } from "../constants/designSystem";

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
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { showError } = useErrorFeedback();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsersRetryRef = useRef<() => void>(() => {});

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiRequest("/api/Users", {}, token);
      setError("");
      setUsers(data);
    } catch (err) {
      logAppError("Loading admin dashboard users", err);
      showError(getUserFacingError(err, {
        title: "We couldn't load the dashboard",
        message: "The account information is temporarily unavailable. Please try again.",
        actionLabel: "Try again",
      }), () => { loadUsersRetryRef.current(); });
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    loadUsersRetryRef.current = () => { void loadUsers(); };
  }, [loadUsers]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    loadUsersRetryRef.current();
  }, [user, loadUsers]);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (logoutError) {
            logAppError("Logging out from the admin dashboard", logoutError);
            showError(getUserFacingError(logoutError, {
              title: "We couldn't log you out",
              message: "Your session could not be cleared. Please try again.",
            }));
          }
        },
      },
    ]);
  }

  const userCount = users.length;

  const restaurantCount = users.filter(
    (user) => user.role === "Restaurant",
  ).length;

  const driverCount = users.filter((user) => user.role === "Driver").length;

  const customerCount = users.filter((user) => user.role === "Customer").length;

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Admin Dashboard</Text>

          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Welcome back, {user.firstName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.push("/account-settings" as any)}>
            <Text style={{ color: colors.headerText, fontWeight: "700" }}>My Account</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/settings" as any)}>
            <Text style={{ color: colors.headerText, fontWeight: "700" }}>Settings</Text>
          </Pressable>
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F97316" />

            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.retryButton} onPress={loadUsers}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Dashboard */}
        {!loading && error === "" && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>Overview</Text>

              <View style={styles.statsGrid}>
                <StatCard title="Total Users" value={userCount} colors={colors} />

                <StatCard title="Customers" value={customerCount} colors={colors} />

                <StatCard title="Restaurants" value={restaurantCount} colors={colors} />

                <StatCard title="Drivers" value={driverCount} colors={colors} />
              </View>
            </View>

            {/* Management */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>Management</Text>

              <DashboardButton
                title="User Management"
                subtitle="View and manage customer, restaurant, driver and admin accounts."
                colors={colors}
                onPress={() => router.push("/admin-users")}
              />

              <DashboardButton
                title="Restaurant partner applications"
                subtitle="Review applications, verify documents and banking details, and approve new restaurant partners."
                colors={colors}
                onPress={() => router.push("/admin-restaurant-applications" as any)}
              />

              <DashboardButton
                title="Driver partner applications"
                subtitle="Review delivery partner registrations, verify supporting documents and approve drivers."
                colors={colors}
                onPress={() => router.push("/admin-driver-applications" as any)}
              />

              <DashboardButton
                title="Restaurants"
                subtitle="Manage restaurants and restaurant-related information."
                colors={colors}
                onPress={() => router.push("/admin-restaurants")}
              />

              <DashboardButton
                title="Drivers"
                subtitle="View and manage GrabnBite Drivers."
                colors={colors}
                onPress={() => router.push("/admin-drivers")}
              />

              <DashboardButton
                title="Payment Reconciliation"
                subtitle="Review unresolved payments, inspect audit history and record verified refund outcomes."
                colors={colors}
                onPress={() => router.push("/admin-payment-reconciliation" as any)}
              />

              <DashboardButton
                title="Policy Management"
                subtitle="Add, update, publish and archive customer policy documents."
                colors={colors}
                onPress={() => router.push("/admin-policies")}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ title, value, colors }: { title: string; value: number; colors: typeof AppThemeColors[keyof typeof AppThemeColors] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function DashboardButton({
  title,
  subtitle,
  onPress,
  colors,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: typeof AppThemeColors[keyof typeof AppThemeColors];
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dashboardButton,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.dashboardButtonContent}>
        <Text style={[styles.dashboardButtonTitle, { color: colors.text }]}>{title}</Text>

        <Text style={[styles.dashboardButtonSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>

      <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
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
    paddingHorizontal: Layout.screenHorizontal,
    paddingTop: Spacing.xxl,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: Typography.title,
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
    marginTop: Spacing.lg,
  },

  sectionTitle: {
    color: "#F47721",
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
    borderRadius: Radius.card,
    padding: Layout.cardPadding,
    minWidth: 180,
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statValue: {
    color: "#071B2C",
    fontSize: Typography.title,
    fontWeight: "800",
  },

  statTitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },

  dashboardButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Layout.cardPadding,
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
    fontSize: Typography.title,
    fontWeight: "300",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.card,
    padding: Layout.cardPadding,
    marginTop: Spacing.xl,
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
