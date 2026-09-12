import { getRestaurantImage } from "@/constants/assetImages";
import { getRestaurants, Restaurant } from "@/services/restaurantService";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

export default function CustomerHomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark
    ? {
        background: "#11151b",
        header: "#171b22",
        card: "#1d222b",
        cardBorder: "#303540",
        text: "#eef2f7",
        textSoft: "#aeb4bf",
        textMuted: "#7f8a99",
        input: "#171b22",
        inputBorder: "#303540",
        imageBackground: "#313640",
        cardDivider: "#313640",
        accent: "#ff8a65",
        badgeOpen: "#2ba86b",
        badgeClosed: "#d64545",
        button: "#ff8a65",
      }
    : {
        background: "#F7F9FC",
        header: "#FFFFFF",
        card: "#FFFFFF",
        cardBorder: "#E1E6EC",
        text: "#222831",
        textSoft: "#69717D",
        textMuted: "#8A8F98",
        input: "#FFFFFF",
        inputBorder: "#DDE3EA",
        imageBackground: "#DCEBFA",
        cardDivider: "#EDF0F3",
        accent: "#208AEF",
        badgeOpen: "#2E9B59",
        badgeClosed: "#D64545",
        button: "#208AEF",
      };

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
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <View style={[styles.topHeader, { backgroundColor: palette.header, borderBottomColor: palette.cardBorder }]}> 
        <View style={styles.deliveryLocationContainer}>
          <View style={styles.brandRow}>
            <Image
              source={require("@/assets/images/logo.jpeg")}
              style={styles.brandLogo}
              resizeMode="cover"
            />
            <Text style={[styles.brandName, { color: palette.text }]}>Grubn<Text style={{ color: palette.accent }}>Bite</Text></Text>
          </View>
        </View>

        <Pressable
          style={[styles.cartHeaderButton, { backgroundColor: isDark ? "#252b35" : "#EAF4FF" }]}
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
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: palette.accent }]}>Hungry?</Text>

          <Text style={[styles.greetingSubtitle, { color: palette.accent }]}> 
            Order delicious food from local restaurants
          </Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: palette.input, borderColor: palette.inputBorder }]}> 
          <Text style={[styles.searchIcon, { color: palette.textMuted }]}>⌕</Text>

          <TextInput
            style={[styles.searchInput, { color: palette.text }]}
            placeholder="Search restaurants, burgers, pizzas..."
            placeholderTextColor={palette.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Text style={[styles.clearButton, { color: palette.textMuted }]}>×</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Popular Restaurants</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}> 
              {filteredRestaurants.length}{" "}
              {filteredRestaurants.length === 1 ? "restaurant" : "restaurants"}{" "}
              available
            </Text>
          </View>
        </View>

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.textSoft }]}>Finding restaurants...</Text>
          </View>
        )}

        {!loading && error !== "" && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Couldn't load restaurants</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textSoft }]}>{error}</Text>
            <Pressable style={[styles.retryButton, { backgroundColor: palette.button }]} onPress={loadRestaurants}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!loading && error === "" && filteredRestaurants.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No restaurants found</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textSoft }]}>Try searching for another restaurant.</Text>
          </View>
        )}

        {!loading && error === "" && filteredRestaurants.length > 0 && (
          <View>
            {filteredRestaurants.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={({ pressed }) => [
                  styles.restaurantCard,
                  { backgroundColor: palette.card, borderColor: palette.cardBorder },
                  pressed && styles.restaurantCardPressed,
                ]}
                onPress={() => handleRestaurantPress(restaurant)}
              >
                <View style={[styles.imageWrapper, { backgroundColor: palette.imageBackground }]}> 
                  <Image
                    source={
                      restaurant.imageUrl
                        ? { uri: restaurant.imageUrl }
                        : getRestaurantImage(restaurant.name)
                    }
                    style={styles.restaurantImage}
                    resizeMode="cover"
                  />

                  <View style={styles.imageOverlayBadge}>
                    <View style={[styles.statusBadge, restaurant.isOpen ? { backgroundColor: palette.badgeOpen } : { backgroundColor: palette.badgeClosed }]}> 
                      <Text style={styles.statusBadgeText}>{restaurant.isOpen ? "OPEN NOW" : "CLOSED"}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.restaurantName, { color: palette.text }]} numberOfLines={1}>{restaurant.name}</Text>
                  </View>

                  <Text style={[styles.restaurantDescription, { color: palette.textSoft }]} numberOfLines={2}>
                    {restaurant.description || "Delicious food waiting for you."}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: palette.cardDivider }]}> 
                    <View style={styles.addressRow}>
                      <Text style={styles.addressIcon}>📍</Text>
                      <Text style={[styles.addressText, { color: palette.textMuted }]} numberOfLines={1}>{restaurant.address}</Text>
                    </View>

                    <Text style={[styles.viewText, { color: palette.accent }]}>View menu →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {!loading && error === "" && restaurants.length > 0 && (
          <View style={styles.dealsSection}>
            <View style={styles.dealsHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Deals & Discounts</Text>
                <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>Save more on your next order</Text>
              </View>
              <Text style={[styles.dealsAccent, { color: palette.accent }]}>TODAY</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dealsList}
            >
              {restaurants.slice(0, 5).map((restaurant, index) => (
                <Pressable
                  key={`${restaurant.id}-deal`}
                  style={({ pressed }) => [
                    styles.dealCard,
                    { backgroundColor: palette.card, borderColor: palette.cardBorder },
                    pressed && styles.restaurantCardPressed,
                  ]}
                  onPress={() => handleRestaurantPress(restaurant)}
                >
                  <Image
                    source={
                      restaurant.imageUrl
                        ? { uri: restaurant.imageUrl }
                        : getRestaurantImage(restaurant.name)
                    }
                    style={styles.dealImage}
                    resizeMode="cover"
                  />
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>{index % 2 === 0 ? "20% OFF" : "15% OFF"}</Text>
                  </View>
                  <View style={styles.dealContent}>
                    <Text style={[styles.dealRestaurantName, { color: palette.text }]} numberOfLines={1}>
                      {restaurant.name}
                    </Text>
                    <Text style={[styles.dealDescription, { color: palette.textSoft }]} numberOfLines={1}>
                      Limited-time offer
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  deliveryLocationContainer: {
    flex: 1,
    marginRight: 16,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 8,
  },

  brandName: {
    fontSize: 18,
    fontWeight: "800",
  },

  deliveringToLabel: {
    fontSize: 10,
    fontWeight: "700",
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
  },

  cartHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  },

  greetingSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    marginBottom: 24,
  },

  searchIcon: {
    fontSize: 25,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    outlineStyle: "none" as any,
  },

  clearButton: {
    fontSize: 24,
    lineHeight: 24,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  restaurantCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
  },

  restaurantCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  imageWrapper: {
    height: 155,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  restaurantImage: {
    width: "100%",
    height: "100%",
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
  },

  restaurantDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 13,
  },

  cardFooter: {
    borderTopWidth: 1,
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
  },

  dealsSection: {
    marginTop: 10,
  },

  dealsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  dealsAccent: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 4,
  },

  dealsList: {
    paddingRight: 20,
  },

  dealCard: {
    width: 190,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginRight: 12,
  },

  dealImage: {
    width: "100%",
    height: 108,
  },

  dealBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#F47A20",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  dealBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  dealContent: {
    padding: 11,
  },

  dealRestaurantName: {
    fontSize: 15,
    fontWeight: "700",
  },

  dealDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  viewText: {
    fontSize: 12,
    fontWeight: "700",
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
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
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