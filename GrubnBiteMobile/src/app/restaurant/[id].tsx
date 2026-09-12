import { apiRequest } from "@/services/api";
import { Restaurant, getRestaurant } from "@/services/restaurantService";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  menuCategoryId: number;
}

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadRestaurant();
    }
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      setError("");

      const restaurantId = Number(id);
      if (Number.isNaN(restaurantId)) {
        throw new Error("Invalid restaurant ID.");
      }

      const [restaurantData, menuData] = await Promise.all([
        getRestaurant(restaurantId),
        apiRequest<MenuItem[]>(`/api/MenuItem/restaurant/${restaurantId}`),
      ]);

      setRestaurant(restaurantData);
      setMenuItems(Array.isArray(menuData) ? menuData : []);
    } catch (err) {
      console.error("Restaurant details error:", err);
      setError(err instanceof Error ? err.message : "Failed to load restaurant.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    // Replace this with your cart logic (context, redux, etc.)
    console.log("Added to cart:", item);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error !== "" || !restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Couldn't load restaurant</Text>
        <Text style={styles.errorMessage}>{error || "Restaurant not found."}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backIconButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>

        <Pressable style={styles.cartButton} onPress={() => router.push("/cart")}>
          <Text style={styles.cartIcon}>🛒</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Hero */}
        {restaurant && (
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🍔</Text>
            <View
              style={[
                styles.statusBadge,
                restaurant.isOpen ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
              </Text>
            </View>
          </View>
        )}

        {/* Restaurant Information */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.description}>
            {restaurant.description || "Delicious food made for you."}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{restaurant.address}</Text>
          </View>

          {!!restaurant.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoText}>{restaurant.phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          <Text style={styles.menuSubtitle}>Choose something delicious</Text>
        </View>

        {/* Empty Menu */}
        {menuItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No menu items yet</Text>
            <Text style={styles.emptySubtitle}>
              This restaurant hasn't added any menu items yet.
            </Text>
          </View>
        )}

        {/* Menu Items */}
        {menuItems.map((item) => (
          <View
            key={item.id}
            style={[styles.menuCard, !item.isAvailable && styles.menuCardUnavailable]}
          >
            <View style={styles.menuItemContent}>
              <Text
                style={[styles.menuItemName, !item.isAvailable && styles.unavailableText]}
              >
                {item.name}
              </Text>
              <Text style={styles.menuItemDescription}>
                {item.description || "A delicious choice from the restaurant."}
              </Text>
              <Text style={styles.price}>R{Number(item.price).toFixed(2)}</Text>
              {!item.isAvailable && (
                <Text style={styles.unavailableLabel}>Currently unavailable</Text>
              )}
            </View>

            {item.isAvailable && (
              <Pressable style={styles.addButton} onPress={() => addToCart(item)}>
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // (same styles as before, unchanged)
});
