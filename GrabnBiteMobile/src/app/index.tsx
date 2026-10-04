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
            <Text style={styles.eyebrow}>DELIVERING GREAT FOOD</Text>

            <Text style={styles.heroTitle}>What are you craving today?</Text>

            <Text style={styles.heroSubtitle}>
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

              <Text style={styles.loadingText}>
                Finding restaurants near you...
              </Text>
            </View>
          )}

          {!loading && error !== "" && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && error === "" && filteredRestaurants.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>

              <Text style={styles.emptyTitle}>No restaurants found</Text>

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
                  isOpen={restaurant.isOpen}
                  imageUrl={restaurant.imageUrl}
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
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <CustomerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071B2C",
  },

  scrollContent: {
    paddingBottom: 120,
  },

  hero: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
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
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
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
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#0D2638",
    borderRadius: 18,
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
