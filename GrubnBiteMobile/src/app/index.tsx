import { getRestaurants, Restaurant } from "@/services/restaurantService";
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

export default function CustomerHomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
            placeholderTextColor="#8A8F98"
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
            <ActivityIndicator size="large" color="#208AEF" />

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
                Try searching for another restaurant.
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
                    <Text style={styles.foodEmoji}>
                      🍔
                    </Text>

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
    backgroundColor: "#F7F9FC",
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF1",
  },

  deliveryLocationContainer: {
    flex: 1,
    marginRight: 16,
  },

  deliveringToLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A8F98",
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
    color: "#222831",
  },

  cartHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF4FF",
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
    color: "#222831",
  },

  greetingSubtitle: {
    fontSize: 14,
    color: "#69717D",
    marginTop: 5,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#DDE3EA",
    marginBottom: 24,
  },

  searchIcon: {
    fontSize: 25,
    color: "#8A8F98",
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#222831",
    outlineStyle: "none" as any,
  },

  clearButton: {
    fontSize: 24,
    color: "#8A8F98",
    lineHeight: 24,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222831",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#8A8F98",
    marginTop: 3,
  },

  restaurantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E1E6EC",
  },

  restaurantCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  imageWrapper: {
    height: 155,
    width: "100%",
    backgroundColor: "#DCEBFA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  foodEmoji: {
    fontSize: 65,
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
    backgroundColor: "#2E9B59",
  },

  closedBadge: {
    backgroundColor: "#D64545",
  },

  statusBadgeText: {
    color: "#FFFFFF",
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
    color: "#222831",
  },

  restaurantDescription: {
    fontSize: 13,
    color: "#69717D",
    lineHeight: 18,
    marginBottom: 13,
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EDF0F3",
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
    color: "#8A8F98",
  },

  viewText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#208AEF",
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
    color: "#69717D",
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
    color: "#222831",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#8A8F98",
    marginTop: 5,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: "#208AEF",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});