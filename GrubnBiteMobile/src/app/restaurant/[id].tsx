import { FoodColors } from "@/constants/theme";
import { apiRequest } from "@/services/api";
import { addCartItem } from "@/services/cartService";
import { Restaurant, getRestaurant } from "@/services/restaurantService";
import { isLoggedIn } from "@/services/sessionService";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const [addingItemId, setAddingItemId] = useState<number | null>(null);

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
        apiRequest<MenuItem[]>(
          `/api/MenuItem/restaurant/${restaurantId}`,
        ),
      ]);

      console.log("Restaurant:", restaurantData);
      console.log("Menu:", menuData);

      setRestaurant(restaurantData);
      setMenuItems(menuData);
    } catch (error) {
      console.error("Restaurant details error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load restaurant.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: MenuItem) => {
    if (!isLoggedIn()) {
      Alert.alert(
        "Log in to order",
        "Create an account or log in before adding items to your cart.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log in", onPress: () => router.push("/login") },
        ],
      );
      return;
    }

    try {
      setAddingItemId(item.id);
      await addCartItem({ menuItemId: item.id, quantity: 1 });
      Alert.alert("Added to cart", `${item.name} is ready for checkout.`);
    } catch (error) {
      Alert.alert(
        "Could not add item",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setAddingItemId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={FoodColors.tomato} />

        <Text style={styles.loadingText}>
          Loading restaurant...
        </Text>
      </View>
    );
  }

  if (error !== "" || !restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>

        <Text style={styles.errorTitle}>
          Couldn't load restaurant
        </Text>

        <Text style={styles.errorMessage}>
          {error || "Restaurant not found."}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>

        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Hero */}
        <View style={styles.hero}>
          {restaurant.imageUrl ? (
            <Image
              source={{ uri: restaurant.imageUrl }}
              contentFit="cover"
              transition={250}
              style={styles.heroImage}
            />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroEmoji}>🍔</Text>
              <Text style={styles.heroFallbackText}>Fresh food, made daily</Text>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              restaurant.isOpen
                ? styles.openBadge
                : styles.closedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {restaurant.isOpen
                ? "OPEN NOW"
                : "CLOSED"}
            </Text>
          </View>
        </View>

        {/* Restaurant Information */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>
            {restaurant.name}
          </Text>

          <Text style={styles.description}>
            {restaurant.description ||
              "Delicious food made for you."}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>

            <Text style={styles.infoText}>
              {restaurant.address}
            </Text>
          </View>

          {!!restaurant.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>

              <Text style={styles.infoText}>
                {restaurant.phoneNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>
            Menu
          </Text>

          <Text style={styles.menuSubtitle}>
            Choose something delicious
          </Text>
        </View>

        {/* Empty Menu */}
        {menuItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>

            <Text style={styles.emptyTitle}>
              No menu items yet
            </Text>

            <Text style={styles.emptySubtitle}>
              This restaurant hasn't added any
              menu items yet.
            </Text>
          </View>
        )}

        {/* Menu Items */}
        {menuItems.map((item) => (
          <View
            key={item.id}
            style={[
              styles.menuCard,
              !item.isAvailable &&
                styles.menuCardUnavailable,
            ]}
          >
            <View style={styles.menuItemContent}>
              <Text
                style={[
                  styles.menuItemName,
                  !item.isAvailable &&
                    styles.unavailableText,
                ]}
              >
                {item.name}
              </Text>

              <Text style={styles.menuItemDescription}>
                {item.description ||
                  "A delicious choice from the restaurant."}
              </Text>

              <Text style={styles.price}>
                R{Number(item.price).toFixed(2)}
              </Text>

              {!item.isAvailable && (
                <Text style={styles.unavailableLabel}>
                  Currently unavailable
                </Text>
              )}
            </View>

            {item.isAvailable && (
              <Pressable
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
                disabled={addingItemId === item.id}
              >
                {addingItemId === item.id ? (
                  <ActivityIndicator color={FoodColors.onDark} size="small" />
                ) : (
                  <Text style={styles.addButtonText}>+</Text>
                )}
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FoodColors.oat,
  },

  header: {
    height: 62,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    color: FoodColors.ink,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FoodColors.peach,
    alignItems: "center",
    justifyContent: "center",
  },

  cartIcon: {
    fontSize: 19,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  hero: {
    height: 190,
    backgroundColor: FoodColors.cream,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  heroEmoji: {
    fontSize: 75,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  heroFallbackText: {
    color: FoodColors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  statusBadge: {
    position: "absolute",
    top: 14,
    left: 16,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  openBadge: {
    backgroundColor: FoodColors.green,
  },

  closedBadge: {
    backgroundColor: FoodColors.tomatoDark,
  },

  statusText: {
    color: FoodColors.onDark,
    fontSize: 10,
    fontWeight: "800",
  },

  restaurantInfo: {
    backgroundColor: FoodColors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },

  restaurantName: {
    fontSize: 24,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  description: {
    fontSize: 14,
    color: FoodColors.muted,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoIcon: {
    fontSize: 14,
    width: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: FoodColors.muted,
  },

  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },

  menuTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  menuSubtitle: {
    fontSize: 13,
    color: FoodColors.muted,
    marginTop: 3,
  },

  menuCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FoodColors.line,
    flexDirection: "row",
    alignItems: "center",
  },

  menuCardUnavailable: {
    opacity: 0.55,
  },

  menuItemContent: {
    flex: 1,
    paddingRight: 12,
  },

  menuItemName: {
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  unavailableText: {
    color: FoodColors.muted,
  },

  menuItemDescription: {
    fontSize: 13,
    color: FoodColors.muted,
    lineHeight: 18,
    marginTop: 5,
  },

  price: {
    fontSize: 15,
    fontWeight: "800",
    color: FoodColors.tomato,
    marginTop: 9,
  },

  unavailableLabel: {
    fontSize: 11,
    color: FoodColors.tomatoDark,
    fontWeight: "600",
    marginTop: 5,
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: FoodColors.onDark,
    fontSize: 26,
    fontWeight: "500",
    lineHeight: 28,
  },

  emptyContainer: {
    marginHorizontal: 20,
    backgroundColor: FoodColors.surface,
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 13,
    color: FoodColors.muted,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F7F9FC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#69717D",
  },

  errorIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222831",
    textAlign: "center",
  },

  errorMessage: {
    fontSize: 13,
    color: "#69717D",
    textAlign: "center",
    marginTop: 7,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: "#208AEF",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 9,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});