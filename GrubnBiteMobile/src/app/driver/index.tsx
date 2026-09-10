import RoleGuard from "@/components/RoleGuard";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getMyDelivery,
  getMyDriver,
  setDriverOffline,
  setDriverOnline,
  Driver,
  Delivery,
} from "@/services/driverService";

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";

  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function DriverDashboard() {
  const router = useRouter();

  const [driver, setDriver] = useState<Driver | null>(
    null,
  );

  const [delivery, setDelivery] =
    useState<Delivery | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingStatus, setChangingStatus] =
    useState(false);

  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setError("");

      const driverResult = await getMyDriver();

      setDriver(driverResult);

      try {
        const deliveryResult = await getMyDelivery();
        setDelivery(deliveryResult);
      } catch {
        /*
         * A driver may simply have no delivery assigned.
         * That is not a dashboard error.
         */
        setDelivery(null);
      }
    } catch (err) {
      console.error("Failed to load driver:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load driver information.",
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

  const changeOnlineStatus = async (
    online: boolean,
  ) => {
    try {
      setChangingStatus(true);

      const updated = online
        ? await setDriverOnline()
        : await setDriverOffline();

      setDriver(updated);
    } catch (err) {
      console.error(err);

      Alert.alert(
        "Unable to change status",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>
          Loading driver dashboard...
        </Text>
      </View>
    );
  }

  if (error || !driver) {
    return (

      <View style={styles.center}>
        <Text style={styles.errorIcon}>🚴</Text>

        <Text style={styles.errorTitle}>
          Driver Account
        </Text>

        <Text style={styles.errorText}>
          {error || "Driver profile not found."}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            router.push("/driver/register")
          }
        >
          <Text style={styles.buttonText}>
            Register as Driver
          </Text>
        </Pressable>
      </View>
    );
  }

  if (driver.isApproved === false) {
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
        <Text style={styles.eyebrow}>
          DRIVER ACCOUNT
        </Text>

        <Text style={styles.title}>
          Application Pending
        </Text>

        <View style={styles.pendingCard}>
          <Text style={styles.pendingIcon}>⏳</Text>

          <Text style={styles.pendingTitle}>
            Awaiting approval
          </Text>

          <Text style={styles.pendingText}>
            Your driver application has been submitted.
            An administrator needs to approve your account
            before you can go online.
          </Text>
        </View>

        <View style={styles.vehicleCard}>
          <Text style={styles.sectionTitle}>
            Vehicle
          </Text>

          <Text style={styles.vehicleType}>
            {driver.vehicleType || "Not specified"}
          </Text>

          <Text style={styles.muted}>
            {driver.vehicleRegistration ||
              "Registration not specified"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <RoleGuard allowedRoles={["driver"]}>
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
      <Text style={styles.eyebrow}>
        DRIVER DASHBOARD
      </Text>

      <Text style={styles.title}>
        Ready to Deliver?
      </Text>

      <Text style={styles.subtitle}>
        Manage your availability and deliveries.
      </Text>

      <View style={styles.onlineCard}>
        <View style={styles.onlineInfo}>
          <View
            style={[
              styles.onlineDot,
              driver.isOnline
                ? styles.online
                : styles.offline,
            ]}
          />

          <View>
            <Text style={styles.onlineTitle}>
              {driver.isOnline
                ? "You are Online"
                : "You are Offline"}
            </Text>

            <Text style={styles.muted}>
              {driver.isOnline
                ? "You can receive delivery assignments."
                : "Go online to receive deliveries."}
            </Text>
          </View>
        </View>

        <Switch
          value={driver.isOnline === true}
          onValueChange={changeOnlineStatus}
          disabled={
            changingStatus || driver.isApproved !== true
          }
        />
      </View>

      <Text style={styles.sectionTitle}>
        Current Delivery
      </Text>

      {!delivery ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>

          <Text style={styles.emptyTitle}>
            No delivery assigned
          </Text>

          <Text style={styles.emptyText}>
            Your next delivery will appear here when it is
            assigned to you.
          </Text>
        </View>
      ) : (
        <Pressable
          style={styles.deliveryCard}
          onPress={() =>
            router.push("/driver/deliveries")
          }
        >
          <View style={styles.deliveryHeader}>
            <View>
              <Text style={styles.deliveryTitle}>
                Delivery #{delivery.id}
              </Text>

              <Text style={styles.muted}>
                Order #{delivery.orderId ?? "—"}
              </Text>
            </View>

            <View style={styles.deliveryStatus}>
              <Text style={styles.deliveryStatusText}>
                {formatStatus(delivery.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.viewDelivery}>
            Open delivery →
          </Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>
        Your Vehicle
      </Text>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleType}>
          {driver.vehicleType || "Vehicle"}
        </Text>

        <Text style={styles.muted}>
          {driver.vehicleRegistration ||
            "Registration unavailable"}
        </Text>
      </View>

      <Pressable
        style={styles.manageButton}
        onPress={() =>
          router.push("/driver/deliveries")
        }
      >
        <Text style={styles.manageButtonText}>
          View Deliveries
        </Text>
      </Pressable>
    </ScrollView>
    </RoleGuard>
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

  eyebrow: {
    marginTop: 5,
    color: "#2C7A9E",
    fontSize: 11,
    fontWeight: "800",
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

  onlineCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  onlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },

  online: {
    backgroundColor: "#22C55E",
  },

  offline: {
    backgroundColor: "#94A3B8",
  },

  onlineTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  muted: {
    marginTop: 4,
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

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 20,
  },

  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  deliveryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  deliveryStatus: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  deliveryStatusText: {
    fontSize: 11,
    color: "#1E3A8A",
    fontWeight: "800",
  },

  viewDelivery: {
    marginTop: 16,
    color: "#2C7A9E",
    fontWeight: "800",
  },

  vehicleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  vehicleType: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  manageButton: {
    marginTop: 20,
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  manageButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  pendingCard: {
    marginTop: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  pendingIcon: {
    fontSize: 45,
  },

  pendingTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#92400E",
  },

  pendingText: {
    marginTop: 8,
    textAlign: "center",
    color: "#78350F",
    lineHeight: 21,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#071B2C",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  loading: {
    marginTop: 10,
    color: "#64748B",
  },

  errorIcon: {
    fontSize: 48,
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: "800",
    color: "#071B2C",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
  },
});