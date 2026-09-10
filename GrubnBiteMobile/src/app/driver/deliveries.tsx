import RoleGuard from "@/components/RoleGuard";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  completeDelivery,
  getDeliveryLocation,
  getMyDelivery,
  pickupDelivery,
  startDelivery,
  updateDeliveryLocation,
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

export default function DriverDeliveriesScreen() {
  const [delivery, setDelivery] =
    useState<Delivery | null>(null);

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadDelivery = async () => {
    try {
      setError("");

      const result = await getMyDelivery();

      setDelivery(result);

      try {
        const location = await getDeliveryLocation(
          result.id,
        );

        setLatitude(location.latitude);
        setLongitude(location.longitude);
      } catch {
        setLatitude(null);
        setLongitude(null);
      }
    } catch (err) {
      console.error("Failed to load delivery:", err);

      setDelivery(null);

      setError(
        err instanceof Error
          ? err.message
          : "No active delivery found.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDelivery();
    }, []),
  );

  /*
   * Refresh the delivery periodically while the driver
   * remains on this screen.
   *
   * This is intentionally REST polling for now.
   * SignalR can be added during the integration phase.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadDelivery();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const performAction = async (
    action: () => Promise<Delivery>,
    successMessage: string,
  ) => {
    if (!delivery) return;

    try {
      setUpdating(true);

      const updated = await action();

      setDelivery(updated);

      Alert.alert(
        "Delivery updated",
        successMessage,
      );
    } catch (err) {
      console.error(err);

      Alert.alert(
        "Unable to update delivery",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const sendLocation = async () => {
    if (!delivery) return;

    /*
     * For the first frontend build we don't generate
     * fake GPS coordinates.
     *
     * Real device GPS can be connected later using
     * expo-location.
     */
    if (latitude === null || longitude === null) {
      Alert.alert(
        "Location unavailable",
        "Live GPS location will be connected during the integration phase.",
      );
      return;
    }

    try {
      setUpdating(true);

      await updateDeliveryLocation(delivery.id, {
        latitude,
        longitude,
      });

      Alert.alert(
        "Location updated",
        "Your delivery location has been sent.",
      );
    } catch (err) {
      Alert.alert(
        "Unable to update location",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loading}>
          Loading delivery...
        </Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📦</Text>

        <Text style={styles.emptyTitle}>
          No Active Delivery
        </Text>

        <Text style={styles.emptyText}>
          {error ||
            "You currently do not have a delivery assigned to you."}
        </Text>

        <Pressable
          style={styles.button}
          onPress={loadDelivery}
        >
          <Text style={styles.buttonText}>
            Refresh
          </Text>
        </Pressable>
      </View>
    );
  }

  const status = delivery.status?.toLowerCase() ?? "";

  const isPending =
    status.includes("pending") ||
    status.includes("assigned");

  const isPickedUp =
    status.includes("pickup") ||
    status.includes("picked");

  const isStarted =
    status.includes("start") ||
    status.includes("progress") ||
    status.includes("transit");

  const isCompleted =
    status.includes("complete") ||
    status.includes("deliver");

  return (
    <RoleGuard allowedRoles={["driver"]}>
         <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        ACTIVE DELIVERY
      </Text>

      <Text style={styles.title}>
        Delivery #{delivery.id}
      </Text>

      <Text style={styles.orderNumber}>
        Order #{delivery.orderId ?? "—"}
      </Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>
          Current Status
        </Text>

        <Text style={styles.status}>
          {formatStatus(delivery.status)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Delivery Progress
      </Text>

      <View style={styles.progressCard}>
        <ProgressStep
          label="Delivery Assigned"
          active
          completed={
            isPickedUp ||
            isStarted ||
            isCompleted
          }
        />

        <ProgressStep
          label="Order Picked Up"
          active={isPickedUp || isStarted || isCompleted}
          completed={isStarted || isCompleted}
        />

        <ProgressStep
          label="Delivery Started"
          active={isStarted || isCompleted}
          completed={isCompleted}
        />

        <ProgressStep
          label="Delivered"
          active={isCompleted}
          completed={isCompleted}
          last
        />
      </View>

      <Text style={styles.sectionTitle}>
        Actions
      </Text>

      <View style={styles.actionCard}>
        {isPending ? (
          <ActionButton
            title="Confirm Pickup"
            onPress={() =>
              performAction(
                () => pickupDelivery(delivery.id),
                "The order has been marked as picked up.",
              )
            }
            disabled={updating}
          />
        ) : null}

        {isPickedUp && !isStarted ? (
          <ActionButton
            title="Start Delivery"
            onPress={() =>
              performAction(
                () => startDelivery(delivery.id),
                "The delivery has started.",
              )
            }
            disabled={updating}
          />
        ) : null}

        {isStarted && !isCompleted ? (
          <>
            <ActionButton
              title="Update Location"
              onPress={sendLocation}
              disabled={updating}
            />

            <ActionButton
              title="Complete Delivery"
              onPress={() =>
                performAction(
                  () =>
                    completeDelivery(
                      delivery.id,
                    ),
                  "The delivery has been completed.",
                )
              }
              disabled={updating}
            />
          </>
        ) : null}

        {isCompleted ? (
          <View style={styles.completedBox}>
            <Text style={styles.completedIcon}>
              ✅
            </Text>

            <Text style={styles.completedTitle}>
              Delivery Completed
            </Text>

            <Text style={styles.completedText}>
              This delivery has been completed successfully.
            </Text>
          </View>
        ) : null}

        {updating ? (
          <ActivityIndicator
            style={styles.activity}
          />
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>
        Driver Location
      </Text>

      <View style={styles.locationCard}>
        <Text style={styles.locationIcon}>
          📍
        </Text>

        {latitude !== null &&
        longitude !== null ? (
          <>
            <Text style={styles.locationTitle}>
              Current Location
            </Text>

            <Text style={styles.coordinates}>
              Latitude: {latitude.toFixed(6)}
            </Text>

            <Text style={styles.coordinates}>
              Longitude: {longitude.toFixed(6)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.locationTitle}>
              Location Not Available
            </Text>

            <Text style={styles.locationText}>
              GPS location will be connected when the
              application is running on a supported device.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
    </RoleGuard>
  );
}

function ProgressStep({
  label,
  active,
  completed,
  last,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  last?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.timeline}>
        <View
          style={[
            styles.stepDot,
            active && styles.stepDotActive,
          ]}
        >
          {completed ? (
            <Text style={styles.check}>✓</Text>
          ) : null}
        </View>

        {!last ? (
          <View
            style={[
              styles.line,
              completed && styles.lineActive,
            ]}
          />
        ) : null}
      </View>

      <Text
        style={[
          styles.stepLabel,
          active && styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionButtonText}>
        {title}
      </Text>
    </Pressable>
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

  orderNumber: {
    marginTop: 4,
    color: "#64748B",
  },

  statusCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statusLabel: {
    color: "#64748B",
    fontSize: 12,
  },

  status: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: "800",
    color: "#071B2C",
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  step: {
    flexDirection: "row",
    minHeight: 55,
  },

  timeline: {
    width: 25,
    alignItems: "center",
  },

  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  stepDotActive: {
    backgroundColor: "#2C7A9E",
    borderColor: "#2C7A9E",
  },

  check: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },

  lineActive: {
    backgroundColor: "#2C7A9E",
  },

  stepLabel: {
    marginLeft: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  stepLabelActive: {
    color: "#071B2C",
    fontWeight: "800",
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  actionButton: {
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  activity: {
    marginTop: 5,
  },

  completedBox: {
    alignItems: "center",
    paddingVertical: 15,
  },

  completedIcon: {
    fontSize: 40,
  },

  completedTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#166534",
  },

  completedText: {
    marginTop: 5,
    color: "#64748B",
    textAlign: "center",
  },

  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  locationIcon: {
    fontSize: 40,
  },

  locationTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  coordinates: {
    marginTop: 7,
    color: "#334155",
    fontSize: 13,
  },

  locationText: {
    marginTop: 7,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  loading: {
    marginTop: 10,
    color: "#64748B",
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  errorIcon: {
    fontSize: 45,
  },

  errorTitle: {
    marginTop: 10,
    fontSize: 21,
    fontWeight: "800",
    color: "#071B2C",
  },
});