import { FoodColors } from "@/constants/theme";
import { getRestaurants, Restaurant } from "@/services/restaurantService";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const foodCategories = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "fastfood", label: "Fast food", emoji: "🍟" },
  { key: "pizza", label: "Pizza", emoji: "🍕" },
  { key: "wings", label: "Wings", emoji: "🍗" },
  { key: "burgers", label: "Burgers", emoji: "🍔" },
  { key: "chicken", label: "Chicken", emoji: "🍗" },
  { key: "breakfast", label: "Breakfast", emoji: "🥞" },
  { key: "ice-cream", label: "Ice cream", emoji: "🍦" },
  { key: "sushi", label: "Sushi", emoji: "🍣" },
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "smoothies", label: "Smoothies", emoji: "🥤" },
  { key: "chinese", label: "Chinese", emoji: "🥡" },
  { key: "desserts", label: "Desserts", emoji: "🍰" },
  { key: "indian", label: "Indian", emoji: "🍛" },
  { key: "sandwiches", label: "Sandwiches", emoji: "🥪" },
  { key: "seafood", label: "Seafood", emoji: "🦐" },
] as const;

export default function CustomerHomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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

      console.log("Restaurants loaded:", data);

      setRestaurants(data);
    } catch (error) {
      console.error("Restaurant loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load restaurants.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesCategory =
      selectedCategory === "all" ||
      restaurant.categories.includes(selectedCategory);

    if (!matchesCategory) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.description.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query)
    );
  });

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.deliveryLocationContainer}>
          <Text style={styles.deliveringToLabel}>DELIVERING TO</Text>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>

            <Text style={styles.locationTitle} numberOfLines={1}>
              Select delivery address
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.cartHeaderButton}
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
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            Hungry? 🍔
          </Text>

          <Text style={styles.greetingSubtitle}>
            Order delicious food from local restaurants
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, burgers, pizzas..."
            placeholderTextColor={FoodColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <Text style={styles.clearButton}>×</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {foodCategories.map((category) => {
            const active = selectedCategory === category.key;

            return (
              <Pressable
                key={category.key}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    active && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Popular Restaurants
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredRestaurants.length}{" "}
              {filteredRestaurants.length === 1
                ? "restaurant"
                : "restaurants"}{" "}
              available
            </Text>
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={FoodColors.tomato} />

            <Text style={styles.loadingText}>
              Finding restaurants...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== "" && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>

            <Text style={styles.emptyTitle}>
              Couldn't load restaurants
            </Text>

            <Text style={styles.emptySubtitle}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadRestaurants}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* Empty */}
        {!loading &&
          error === "" &&
          filteredRestaurants.length === 0 && (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🔎</Text>

              <Text style={styles.emptyTitle}>
                No restaurants found
              </Text>

              <Text style={styles.emptySubtitle}>
                Try another search or food category.
              </Text>
            </View>
          )}

        {/* Restaurants */}
        {!loading &&
          error === "" &&
          filteredRestaurants.length > 0 && (
            <View>
              {filteredRestaurants.map((restaurant) => (
                <Pressable
                  key={restaurant.id}
                  style={({ pressed }) => [
                    styles.restaurantCard,
                    pressed && styles.restaurantCardPressed,
                  ]}
                  onPress={() =>
                    handleRestaurantPress(restaurant)
                  }
                >
                  {/* Restaurant Image Placeholder */}
                  <View style={styles.imageWrapper}>
                    {restaurant.imageUrl ? (
                      <Image
                        source={{ uri: restaurant.imageUrl }}
                        contentFit="cover"
                        transition={250}
                        style={styles.restaurantImage}
                      />
                    ) : (
                      <View style={styles.imageFallback}>
                        <Text style={styles.foodEmoji}>🍔</Text>
                        <Text style={styles.imageFallbackText}>
                          Freshly made for you
                        </Text>
                      </View>
                    )}

                    <View style={styles.imageOverlayBadge}>
                      <View
                        style={[
                          styles.statusBadge,
                          restaurant.isOpen
                            ? styles.openBadge
                            : styles.closedBadge,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {restaurant.isOpen
                            ? "OPEN NOW"
                            : "CLOSED"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Restaurant Details */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text
                        style={styles.restaurantName}
                        numberOfLines={1}
                      >
                        {restaurant.name}
                      </Text>
                    </View>

                    <Text
                      style={styles.restaurantDescription}
                      numberOfLines={2}
                    >
                      {restaurant.description ||
                        "Delicious food waiting for you."}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.addressRow}>
                        <Text style={styles.addressIcon}>
                          📍
                        </Text>

                        <Text
                          style={styles.addressText}
                          numberOfLines={1}
                        >
                          {restaurant.address}
                        </Text>
                      </View>

                      <Text style={styles.viewText}>
                        View menu →
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FoodColors.oat,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },

  deliveryLocationContainer: {
    flex: 1,
    marginRight: 16,
  },

  deliveringToLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: FoodColors.muted,
    letterSpacing: 0.8,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  locationIcon: {
    fontSize: 15,
    marginRight: 5,
  },

  locationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: FoodColors.ink,
  },

  cartHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: FoodColors.peach,
    alignItems: "center",
    justifyContent: "center",
  },

  cartIcon: {
    fontSize: 20,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  greetingSection: {
    marginBottom: 18,
  },

  greetingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  greetingSubtitle: {
    fontSize: 14,
    color: FoodColors.muted,
    marginTop: 5,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FoodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: FoodColors.line,
    marginBottom: 24,
  },

  categoryList: {
    gap: 9,
    paddingBottom: 22,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: FoodColors.surface,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },

  categoryChipActive: {
    backgroundColor: FoodColors.tomato,
    borderColor: FoodColors.tomato,
  },

  categoryEmoji: {
    fontSize: 15,
  },

  categoryLabel: {
    color: FoodColors.muted,
    fontSize: 12,
    fontWeight: "800",
  },

  categoryLabelActive: {
    color: FoodColors.onDark,
  },

  searchIcon: {
    fontSize: 25,
    color: FoodColors.muted,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: FoodColors.ink,
    outlineStyle: "none" as any,
  },

  clearButton: {
    fontSize: 24,
    color: FoodColors.muted,
    lineHeight: 24,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: FoodColors.muted,
    marginTop: 3,
  },

  restaurantCard: {
    backgroundColor: FoodColors.surface,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: FoodColors.line,
  },

  restaurantCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  imageWrapper: {
    height: 155,
    width: "100%",
    backgroundColor: FoodColors.cream,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  restaurantImage: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  foodEmoji: {
    fontSize: 65,
  },

  imageFallbackText: {
    color: FoodColors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  imageOverlayBadge: {
    position: "absolute",
    top: 12,
    left: 12,
  },

  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  openBadge: {
    backgroundColor: FoodColors.green,
  },

  closedBadge: {
    backgroundColor: FoodColors.tomatoDark,
  },

  statusBadgeText: {
    color: FoodColors.onDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  cardContent: {
    padding: 15,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  restaurantName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: FoodColors.ink,
  },

  restaurantDescription: {
    fontSize: 13,
    color: FoodColors.muted,
    lineHeight: 18,
    marginBottom: 13,
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: FoodColors.line,
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  addressIcon: {
    fontSize: 12,
    marginRight: 4,
  },

  addressText: {
    flex: 1,
    fontSize: 11,
    color: FoodColors.muted,
  },

  viewText: {
    fontSize: 12,
    fontWeight: "700",
    color: FoodColors.tomato,
  },

  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: FoodColors.muted,
  },

  errorIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: FoodColors.ink,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    color: FoodColors.muted,
    marginTop: 5,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: FoodColors.tomato,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryButtonText: {
    color: FoodColors.onDark,
    fontSize: 14,
    fontWeight: "700",
  },
});