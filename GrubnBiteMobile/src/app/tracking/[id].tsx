import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  getDeliveryLocation,
  getMyDelivery,
  Delivery,
  DeliveryLocation,
} from "@/services/trackingService";

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";

  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date?: string) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString();
};

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const orderId = Number(id);

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [location, setLocation] =
    useState<DeliveryLocation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTracking = useCallback(async () => {
    try {
      setError("");

      const deliveryResult = await getMyDelivery();

      if (
        deliveryResult.orderId &&
        orderId &&
        deliveryResult.orderId !== orderId
      ) {
        setError("No active delivery was found for this order.");
        return;
      }

      setDelivery(deliveryResult);

      try {
        const locationResult = await getDeliveryLocation(
          deliveryResult.id,
        );

        setLocation(locationResult);
      } catch (locationError) {
        console.log(
          "Delivery location is not available yet:",
          locationError,
        );

        setLocation(null);
      }
    } catch (err) {
      console.error("Failed to load tracking:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load delivery tracking.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading delivery tracking...
        </Text>
      </View>
    );
  }

  if (error || !delivery) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📦</Text>

        <Text style={styles.errorTitle}>
          Tracking unavailable
        </Text>

        <Text style={styles.errorText}>
          {error || "No active delivery was found."}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back to Order</Text>
      </Pressable>

      <Text style={styles.title}>Track Your Order</Text>

      <Text style={styles.orderNumber}>
        Order #{delivery.orderId ?? orderId}
      </Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>🚴</Text>

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            {formatStatus(delivery.status)}
          </Text>

          <Text style={styles.statusDescription}>
            Your delivery status will update as your order
            progresses.
          </Text>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>📍</Text>

        <Text style={styles.mapTitle}>Delivery Location</Text>

        {location ? (
          <>
            <Text style={styles.coordinates}>
              Latitude: {location.latitude.toFixed(6)}
            </Text>

            <Text style={styles.coordinates}>
              Longitude: {location.longitude.toFixed(6)}
            </Text>

            {location.timestamp ? (
              <Text style={styles.locationTime}>
                Updated: {formatDate(location.timestamp)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.noLocation}>
            Driver location is not available yet.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Information
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Delivery ID</Text>
          <Text style={styles.infoValue}>{delivery.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoValue}>
            {delivery.orderId ?? orderId}
          </Text>
        </View>

        {delivery.driver?.vehicleType ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>
              {delivery.driver.vehicleType}
            </Text>
          </View>
        ) : null}

        {delivery.driver?.vehicleRegistration ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration</Text>
            <Text style={styles.infoValue}>
              {delivery.driver.vehicleRegistration}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.refreshButton}
        onPress={loadTracking}
      >
        <Text style={styles.refreshText}>Refresh Tracking</Text>
      </Pressable>
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

  back: {
    color: "#2C7A9E",
    fontWeight: "700",
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  orderNumber: {
    marginTop: 5,
    color: "#64748B",
  },

  statusCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statusIcon: {
    fontSize: 38,
    marginRight: 16,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  statusDescription: {
    marginTop: 5,
    color: "#64748B",
    lineHeight: 19,
  },

  mapPlaceholder: {
    marginTop: 14,
    minHeight: 260,
    backgroundColor: "#EAF1F5",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#D6E1E8",
  },

  mapIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  mapTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  coordinates: {
    marginTop: 8,
    color: "#334155",
    fontSize: 13,
  },

  locationTime: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 12,
  },

  noLocation: {
    marginTop: 10,
    color: "#64748B",
    textAlign: "center",
  },

  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoLabel: {
    color: "#64748B",
  },

  infoValue: {
    color: "#1E293B",
    fontWeight: "700",
  },

  refreshButton: {
    marginTop: 16,
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  refreshText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },

  errorIcon: {
    fontSize: 48,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: "800",
    color: "#071B2C",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 21,
  },

  button: {
    marginTop: 20,
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