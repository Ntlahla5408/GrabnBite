import { useRouter, type Href } from "expo-router";
import {useCallback, useEffect, useMemo, useState, useRef} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerBottomNav from "../components/CustomerBottomNav";
import CategoryList from "../components/home/CategoryList";
import HomeHeader from "../components/home/HomeHeader";
import RestaurantCard from "../components/home/RestaurantCard";
import SearchBar from "../components/home/SearchBar";
import SectionHeader from "../components/home/SectionHeader";

import { getRestaurants } from "../services/restaurantService";
import { Restaurant } from "../types/restaurant";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { useAuth } from "../context/authContext";
import { Layout, Radius, Spacing, Typography } from "../constants/designSystem";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemePreference();
  const { user } = useAuth();
  const { showError } = useErrorFeedback();
  const colors = AppThemeColors[theme];
  const normalizedRole = user?.role?.trim().toLowerCase();

  useEffect(() => {
    if (!normalizedRole || normalizedRole === "customer") {
      return;
    }

    if (normalizedRole === "driver") {
      router.replace("/driver-dashboard");
    } else if (normalizedRole === "restaurant") {
      router.replace("/restaurant-dashboard");
    } else if (normalizedRole === "admin") {
      router.replace("/admin-dashboard");
    }
  }, [normalizedRole, router]);

  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRestaurantsRetryRef = useRef<() => void>(() => {});

  const loadRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants();
      setError("");

      // Only show approved restaurants to customers.
      const approvedRestaurants = data.filter(
        (restaurant) => restaurant.isApproved,
      );

      setRestaurants(approvedRestaurants);
    } catch (err) {
      logAppError("Loading restaurant list", err);
      setError("failed");
      showError(getUserFacingError(err, {
        title: "We could not load restaurants",
        message: "Restaurants are not available right now because GrabnBite could not retrieve them. Please try again shortly.",
        actionLabel: "Try again",
      }), () => { setLoading(true); loadRestaurantsRetryRef.current(); });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadRestaurantsRetryRef.current = () => { void loadRestaurants(); };
  }, [loadRestaurants]);

  useEffect(() => {
    if (user && normalizedRole !== "customer") {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    loadRestaurantsRetryRef.current();
  }, [loadRestaurants, user, normalizedRole]);

  const filteredRestaurants = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(searchTerm) ||
        restaurant.description.toLowerCase().includes(searchTerm) ||
        restaurant.address.toLowerCase().includes(searchTerm)
      );
    });
  }, [restaurants, search]);

  if (user && normalizedRole !== "customer") {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.header }]}>
          <View style={styles.heroContent}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>DELIVERING GREAT FOOD</Text>

            <Text style={[styles.heroTitle, { color: colors.headerText }]}>What are you craving today?</Text>

            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Find your favourite meals from restaurants near you.
            </Text>

            <SearchBar value={search} onChangeText={setSearch} />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title="Browse categories"
            subtitle="Find something you're in the mood for"
          />

          <CategoryList onSelectCategory={setSearch} />
        </View>

        {/* Restaurants */}
        <View style={styles.section}>
          <SectionHeader
            title="Restaurants near you"
            subtitle="Fresh food delivered to your door"
          />

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#F97316" />

              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Finding restaurants near you...
              </Text>
            </View>
          )}

          {!loading && error === "" && filteredRestaurants.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>

              <Text style={[styles.emptyTitle, { color: colors.text }]}>No restaurants found</Text>

              <Text style={styles.emptyText}>
                Try searching for another restaurant or type of food.
              </Text>
            </View>
          )}

          {!loading && error === "" && filteredRestaurants.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.restaurantList}
            >
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurantId}
                  name={restaurant.name}
                  cuisine={restaurant.description}
                  location={restaurant.location?.trim() || "Location unavailable"}
                  isOpen={restaurant.isOpen}
                  imageUrl={restaurant.imageUrl}
                  preparationTime={
                    restaurant.averagePreparationTimeMinutes != null
                      ? `${restaurant.averagePreparationTimeMinutes} min prep`
                      : "Prep time unavailable"
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/restaurant",
                      params: {
                        restaurantId: restaurant.restaurantId,
                      },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {user?.role?.toLowerCase() === "customer" && (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open GrabnBite support chat"
        onPress={() => router.push("/chatbot" as Href)}
        style={[styles.chatButton, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.chatButtonIcon}>✦</Text>
        <Text style={styles.chatButtonLabel}>Help</Text>
      </Pressable>
      )}

      <CustomerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  chatButton: {
    position: "absolute",
    right: 18,
    bottom: 96,
    zIndex: 5,
    minWidth: 76,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  chatButtonIcon: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  chatButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 104,
  },

  hero: {
    backgroundColor: "#071B2C",
    paddingHorizontal: Layout.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  heroContent: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },

  eyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: Typography.title,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 8,
  },

  heroSubtitle: {
    color: "#AFC0CC",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
    maxWidth: 420,
  },

  section: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: Layout.screenHorizontal,
    paddingTop: Spacing.lg,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },

  loadingText: {
    marginTop: 12,
    color: "#AFC0CC",
    fontSize: 13,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    textAlign: "center",
  },

  restaurantList: {
    paddingBottom: 8,
    paddingRight: 20,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Layout.screenHorizontal,
    backgroundColor: "#0D2638",
    borderRadius: Radius.panel,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    color: "#AFC0CC",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
