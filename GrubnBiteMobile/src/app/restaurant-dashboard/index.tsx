import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getRestaurants, Restaurant } from "@/services/restaurantService";

export default function RestaurantDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load restaurants.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openOrders = (restaurantId: number) => {
    router.push({
      pathname: "/restaurant-dashboard/orders",
      params: { restaurantId: String(restaurantId) },
    });
  };

  const openMenu = (restaurantId: number) => {
    router.push({
      pathname: "/restaurant-dashboard/menu",
      params: { restaurantId: String(restaurantId) },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading restaurant dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.primaryButton} onPress={loadRestaurants}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="restaurant-outline" size={56} color="#64748B" />

        <Text style={styles.emptyTitle}>No restaurant found</Text>

        <Text style={styles.emptyText}>
          There is no restaurant available for this account yet.
        </Text>
      </View>
    );
  }

  return (
    <RoleGuard
  allowedRoles={["restaurant", "restaurantstaff", "staff"]}
>
 <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Dashboard</Text>
        <Text style={styles.subtitle}>
          Manage orders and your restaurant menu.
        </Text>
      </View>

      {restaurants.map((restaurant) => (
        <View key={restaurant.id} style={styles.restaurantCard}>
          <View style={styles.restaurantHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="restaurant" size={26} color="#FFFFFF" />
            </View>

            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: restaurant.isOpen
                        ? "#16A34A"
                        : "#DC2626",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    {
                      color: restaurant.isOpen ? "#16A34A" : "#DC2626",
                    },
                  ]}
                >
                  {restaurant.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {restaurant.description || "No description available."}
          </Text>

          <Text style={styles.address}>{restaurant.address}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => openOrders(restaurant.id)}
            >
              <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Orders</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => openMenu(restaurant.id)}
            >
              <Ionicons name="fast-food-outline" size={20} color="#071B2C" />
              <Text style={styles.secondaryText}>Manage Menu</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
</RoleGuard>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748B",
  },

  restaurantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#1A4B6B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  restaurantInfo: {
    flex: 1,
  },

  restaurantName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#071B2C",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  description: {
    marginTop: 18,
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },

  address: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#1A4B6B",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  secondaryText: {
    color: "#071B2C",
    fontWeight: "700",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#071B2C",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: "#1A4B6B",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});