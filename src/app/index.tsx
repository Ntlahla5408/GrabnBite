import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

export default function HomeScreen() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      setLoading(true);
      setError("");

      const data = await getRestaurants();

      // Only show approved restaurants to customers.
      const approvedRestaurants = data.filter(
        (restaurant) => restaurant.isApproved,
      );

      setRestaurants(approvedRestaurants);
    } catch (err) {
      console.error("Failed to load restaurants:", err);
      setError("Unable to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <View style={styles.container}>
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>What are you craving today?</Text>

            <Text style={styles.heroSubtitle}>
              Discover great food from restaurants near you.
            </Text>

            <SearchBar value={search} onChangeText={setSearch} />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title="Browse by category"
            subtitle="Find something you love"
          />

          <CategoryList />
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

              <Text style={styles.loadingText}>Loading restaurants...</Text>
            </View>
          )}

          {!loading && error !== "" && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && error === "" && filteredRestaurants.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No restaurants found</Text>

              <Text style={styles.emptyText}>
                Try searching for something else.
              </Text>
            </View>
          )}

          {!loading &&
            error === "" &&
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.restaurantId}
                name={restaurant.name}
                cuisine={restaurant.description}
                rating={restaurant.isOpen ? "Open now" : "Closed"}
                deliveryTime="20–35 min"
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
        </View>
      </ScrollView>
      <CustomerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingBottom: 110,
  },

  hero: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },

  heroContent: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    alignItems: "center",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
  },

  section: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 15,
    textAlign: "center",
  },

  emptyTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 14,
  },
});
