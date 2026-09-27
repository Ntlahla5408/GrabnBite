import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";

const NAVY = "#071B2C";
const ORANGE = "#F97316";
const LIGHT = "#F8FAFC";
const GREEN = "#16A34A";
const RED = "#DC2626";
const GRAY = "#64748B";

type Delivery = {
  deliveryId: number;
  orderId: number;
  driverId?: number | null;
  status: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  driverLatitude?: number | null;
  driverLongitude?: number | null;

  restaurant?: {
    restaurantId: number;
    name: string;
  };

  totalAmount: number;
  orderDate: string;

  deliveryAddress?: any;

  items?: {
    orderItemId: number;
    menuItemId: number;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

export default function DriverDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>(
    [],
  );

  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (user.role !== "Driver") {
        router.replace("/");
        return;
      }

      loadDriverData();
    }, [user]),
  );

  const loadDriverData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Get driver's current profile/status
      const driver = await apiRequest("/api/Driver/me", {}, token);

      setIsOnline(driver.isOnline);

      // Get active delivery
      try {
        const active = await apiRequest("/api/Delivery/my-delivery", {}, token);

        setActiveDelivery(active);
      } catch {
        setActiveDelivery(null);
      }

      // Only get available deliveries when online
      if (driver.isOnline) {
        try {
          const available = await apiRequest(
            "/api/Delivery/available",
            {},
            token,
          );

          setAvailableDeliveries(available);
        } catch {
          setAvailableDeliveries([]);
        }
      } else {
        setAvailableDeliveries([]);
      }
    } catch (error) {
      console.error("Driver dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadDriverData();
  };

  const toggleOnline = async () => {
    if (!token || actionLoading) return;

    try {
      setActionLoading(true);

      const endpoint = isOnline ? "/api/Driver/offline" : "/api/Driver/online";

      await apiRequest(
        endpoint,
        {
          method: "PUT",
        },
        token,
      );

      setIsOnline(!isOnline);

      if (!isOnline) {
        await loadDriverData();
      } else {
        setAvailableDeliveries([]);
      }
    } catch (error: any) {
      Alert.alert(
        "Unable to change status",
        error.message || "Something went wrong.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const acceptDelivery = async (deliveryId: number) => {
    if (!token || actionLoading) return;

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Delivery/${deliveryId}/accept`,
        {
          method: "PUT",
        },
        token,
      );

      Alert.alert("Delivery accepted", "You have accepted this delivery.");

      await loadDriverData();
    } catch (error: any) {
      Alert.alert(
        "Unable to accept delivery",
        error.message || "Something went wrong.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pickupOrder = async () => {
    if (!activeDelivery || !token || actionLoading) return;

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Delivery/${activeDelivery.deliveryId}/pickup`,
        {
          method: "PUT",
        },
        token,
      );

      await loadDriverData();
    } catch (error: any) {
      Alert.alert(
        "Unable to confirm pickup",
        error.message || "Something went wrong.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startDelivery = async () => {
    if (!activeDelivery || !token || actionLoading) return;

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Delivery/${activeDelivery.deliveryId}/start`,
        {
          method: "PUT",
        },
        token,
      );

      await loadDriverData();
    } catch (error: any) {
      Alert.alert(
        "Unable to start delivery",
        error.message || "Something went wrong.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const completeDelivery = async () => {
    if (!activeDelivery || !token || actionLoading) return;

    Alert.alert(
      "Complete delivery",
      "Are you sure the order has been delivered?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete",
          onPress: async () => {
            try {
              setActionLoading(true);

              await apiRequest(
                `/api/Delivery/${activeDelivery.deliveryId}/complete`,
                {
                  method: "PUT",
                },
                token,
              );

              Alert.alert(
                "Delivery completed",
                "The order has been successfully delivered.",
              );

              await loadDriverData();
            } catch (error: any) {
              Alert.alert(
                "Unable to complete delivery",
                error.message || "Something went wrong.",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderActionButton = () => {
    if (!activeDelivery) return null;

    switch (activeDelivery.status) {
      case "ASSIGNED":
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={pickupOrder}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>PICK UP ORDER</Text>
            )}
          </TouchableOpacity>
        );

      case "PICKED_UP":
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startDelivery}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>START DELIVERY</Text>
            )}
          </TouchableOpacity>
        );

      case "DELIVERING":
        return (
          <TouchableOpacity
            style={[styles.primaryButton, styles.completeButton]}
            onPress={completeDelivery}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>COMPLETE DELIVERY</Text>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading driver dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>GrabnBite</Text>
            <Text style={styles.subtitle}>Driver Dashboard</Text>
          </View>

          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ONLINE STATUS */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusTitle}>Driver Status</Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOnline ? GREEN : RED,
                  },
                ]}
              />

              <Text style={styles.statusText}>
                {isOnline ? "You are Online" : "You are Offline"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.toggleButton, isOnline && styles.offlineButton]}
            onPress={toggleOnline}
            disabled={actionLoading}
          >
            <Text style={styles.toggleText}>
              {isOnline ? "GO OFFLINE" : "GO ONLINE"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE DELIVERY */}
        <Text style={styles.sectionTitle}>ACTIVE DELIVERY</Text>

        {activeDelivery ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.restaurantName}>
                  {activeDelivery.restaurant?.name || "Restaurant"}
                </Text>

                <Text style={styles.orderNumber}>
                  Order #{activeDelivery.orderId}
                </Text>
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {activeDelivery.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {activeDelivery.items?.map((item) => (
              <View key={item.orderItemId} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity} × {item.menuItemName}
                </Text>

                <Text style={styles.itemPrice}>
                  R{Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order Total</Text>

              <Text style={styles.totalAmount}>
                R{Number(activeDelivery.totalAmount).toFixed(2)}
              </Text>
            </View>

            {renderActionButton()}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active delivery</Text>

            <Text style={styles.emptyText}>
              Accept a delivery offer to start delivering.
            </Text>
          </View>
        )}

        {/* AVAILABLE DELIVERIES */}
        {!activeDelivery && (
          <>
            <Text style={styles.sectionTitle}>AVAILABLE DELIVERIES</Text>

            {!isOnline ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>You are offline</Text>

                <Text style={styles.emptyText}>
                  Go online to receive delivery offers.
                </Text>
              </View>
            ) : availableDeliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No deliveries available</Text>

                <Text style={styles.emptyText}>
                  New delivery offers will appear here.
                </Text>
              </View>
            ) : (
              availableDeliveries.map((delivery) => (
                <View key={delivery.deliveryId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.restaurantName}>
                        {delivery.restaurant?.name || "Restaurant"}
                      </Text>

                      <Text style={styles.orderNumber}>
                        Order #{delivery.orderId}
                      </Text>
                    </View>

                    <Text style={styles.offerAmount}>
                      R{Number(delivery.totalAmount).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {delivery.items?.map((item) => (
                    <View key={item.orderItemId} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {item.quantity} × {item.menuItemName}
                      </Text>

                      <Text style={styles.itemPrice}>
                        R{Number(item.subtotal).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => acceptDelivery(delivery.deliveryId)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        ACCEPT DELIVERY
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIGHT,
  },

  loadingText: {
    marginTop: 12,
    color: GRAY,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: NAVY,
  },

  subtitle: {
    color: GRAY,
    marginTop: 3,
  },

  logout: {
    color: RED,
    fontWeight: "700",
  },

  statusCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  statusTitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginBottom: 8,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  statusText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  toggleButton: {
    backgroundColor: ORANGE,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  offlineButton: {
    backgroundColor: RED,
  },

  toggleText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: NAVY,
    marginBottom: 12,
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: "800",
    color: NAVY,
  },

  orderNumber: {
    color: GRAY,
    marginTop: 4,
  },

  activeBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  activeBadgeText: {
    color: ORANGE,
    fontWeight: "800",
    fontSize: 11,
  },

  offerAmount: {
    color: GREEN,
    fontWeight: "800",
    fontSize: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  itemName: {
    color: NAVY,
    flex: 1,
  },

  itemPrice: {
    color: GRAY,
    marginLeft: 10,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 14,
    marginTop: 6,
    marginBottom: 16,
  },

  totalLabel: {
    fontWeight: "700",
    color: NAVY,
  },

  totalAmount: {
    fontWeight: "800",
    color: NAVY,
    fontSize: 17,
  },

  primaryButton: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  completeButton: {
    backgroundColor: GREEN,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: NAVY,
    marginBottom: 6,
  },

  emptyText: {
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
});
