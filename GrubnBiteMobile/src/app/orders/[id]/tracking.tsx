import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { getOrder, type Order } from "@/services/orderService";
import { getDeliveryLocation } from "@/services/driverService";
import RoleGuard from "@/components/RoleGuard";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
  green: "#228B55",
  orange: "#D97917",
  red: "#C83C3C",
};

export default function TrackingScreen() {
  const { id, deliveryId: deliveryIdParam } =
    useLocalSearchParams<{
      id: string;
      deliveryId?: string;
    }>();

  const [order, setOrder] = useState<Order | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");

  const deliveryIdFromOrder = order?.deliveryId ?? order?.delivery?.id;

  const deliveryId = deliveryIdParam
    ? Number(deliveryIdParam)
    : deliveryIdFromOrder;

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [id]),
  );

  useEffect(() => {
    if (deliveryId) {
      loadLocation();

      const interval = setInterval(() => {
        loadLocation();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [deliveryId]);

  const loadOrder = async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getOrder(Number(id));

      setOrder(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the order.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLocation = async () => {
    if (!deliveryId || Number.isNaN(deliveryId)) {
      return;
    }

    try {
      setLocationLoading(true);
      setLocationError("");

      const location = await getDeliveryLocation(deliveryId);

      setLatitude(location.latitude);
      setLongitude(location.longitude);
    } catch (err) {
      console.error(err);

      setLocationError(
        "The delivery location is not available yet.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loading}>
          Loading delivery information...
        </Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Tracking unavailable</Text>

        <Text style={styles.errorText}>
          {error || "Order could not be found."}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const status = order.status ?? "Unknown";

  return (
    <RoleGuard allowedRoles={["customer", "user"]}>
<ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Order #{order.id}</Text>
        </Pressable>

        <Text style={styles.title}>Track Delivery</Text>

        <Text style={styles.subtitle}>
          Follow your order's latest location
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Order status</Text>

        <Text style={styles.statusValue}>{status}</Text>

        <View style={styles.progress}>
          <ProgressStep
            label="Placed"
            active={true}
          />

          <ProgressStep
            label="Preparing"
            active={isPreparing(status)}
          />

          <ProgressStep
            label="On the way"
            active={isOnTheWay(status)}
          />

          <ProgressStep
            label="Delivered"
            active={isDelivered(status)}
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>📍</Text>

          <Text style={styles.mapTitle}>
            Delivery Location
          </Text>

          {locationLoading ? (
            <ActivityIndicator
              color={COLORS.blue}
              style={{ marginTop: 12 }}
            />
          ) : latitude !== null && longitude !== null ? (
            <>
              <Text style={styles.coordinates}>
                Latitude: {latitude.toFixed(6)}
              </Text>

              <Text style={styles.coordinates}>
                Longitude: {longitude.toFixed(6)}
              </Text>

              <Text style={styles.updated}>
                Location updates automatically every 15 seconds.
              </Text>
            </>
          ) : (
            <Text style={styles.noLocation}>
              {locationError ||
                "The driver has not shared a location yet."}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>
          Delivery information
        </Text>

        <InfoRow
          label="Order"
          value={`#${order.id}`}
        />

        {order.restaurant?.name ? (
          <InfoRow
            label="Restaurant"
            value={order.restaurant.name}
          />
        ) : null}

        {order.deliveryAddress?.streetAddress ? (
          <InfoRow
            label="Delivering to"
            value={order.deliveryAddress.streetAddress}
          />
        ) : null}

        {deliveryId ? (
          <InfoRow
            label="Delivery"
            value={`#${deliveryId}`}
          />
        ) : null}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>ℹ️</Text>

        <Text style={styles.noticeText}>
          The map will use the driver's latest GPS coordinates.
          For now, the system displays the coordinates received
          from the backend. A full interactive map can be connected
          once the delivery flow is being tested end-to-end.
        </Text>
      </View>
    </ScrollView>
    </RoleGuard>
    
  );
}

function ProgressStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressCircle,
          active && styles.progressCircleActive,
        ]}
      >
        {active ? (
          <Text style={styles.check}>✓</Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.progressLabel,
          active && styles.progressLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[_-]/g, " ");
}

function isPreparing(status: string) {
  const value = normalizeStatus(status);

  return (
    value.includes("prepar") ||
    value.includes("accept") ||
    value.includes("confirm")
  );
}

function isOnTheWay(status: string) {
  const value = normalizeStatus(status);

  return (
    value.includes("way") ||
    value.includes("pickup") ||
    value.includes("transit") ||
    value.includes("start") ||
    value.includes("out")
  );
}

function isDelivered(status: string) {
  const value = normalizeStatus(status);

  return (
    value.includes("deliver") ||
    value.includes("complete")
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
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 5,
    color: "#D9E6ED",
  },

  statusCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },

  statusValue: {
    marginTop: 5,
    color: COLORS.blue,
    fontSize: 22,
    fontWeight: "900",
  },

  progress: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  progressStep: {
    alignItems: "center",
    flex: 1,
  },

  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E9EC",
    justifyContent: "center",
    alignItems: "center",
  },

  progressCircleActive: {
    backgroundColor: COLORS.green,
  },

  check: {
    color: COLORS.white,
    fontWeight: "900",
  },

  progressLabel: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
  },

  progressLabelActive: {
    color: COLORS.green,
    fontWeight: "800",
  },

  mapContainer: {
    marginHorizontal: 20,
  },

  mapPlaceholder: {
    minHeight: 260,
    borderRadius: 18,
    backgroundColor: "#E7EFF2",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  mapIcon: {
    fontSize: 55,
  },

  mapTitle: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.navy,
  },

  coordinates: {
    marginTop: 7,
    color: COLORS.text,
    fontFamily: "monospace",
  },

  updated: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 12,
  },

  noLocation: {
    marginTop: 10,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },

  infoCard: {
    margin: 20,
    backgroundColor: COLORS.white,
    padding: 20,
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

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F3",
  },

  infoLabel: {
    color: COLORS.muted,
  },

  infoValue: {
    color: COLORS.text,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  notice: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFF3E5",
    flexDirection: "row",
  },

  noticeIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  noticeText: {
    flex: 1,
    color: "#76501F",
    lineHeight: 19,
    fontSize: 12,
  },

  errorTitle: {
    color: COLORS.red,
    fontSize: 22,
    fontWeight: "900",
  },

  errorText: {
    marginTop: 8,
    color: COLORS.muted,
    textAlign: "center",
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