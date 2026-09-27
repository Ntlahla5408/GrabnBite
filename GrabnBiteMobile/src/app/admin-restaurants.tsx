import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";

interface Restaurant {
  restaurantId: number;
  name: string;
  description?: string;
  phoneNumber: string;
  email: string;
  address: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  isApproved: boolean;
  createdAt: string;
}

const filters = ["All", "Approved", "Pending"];

export default function AdminRestaurantsScreen() {
  const { user, token } = useAuth();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }

    loadRestaurants();
  }, [user]);

  async function loadRestaurants() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/api/Restaurant",
        {},
        token
      );

      setRestaurants(data);
    } catch (err) {
      console.error("Failed to load restaurants:", err);
      setError("Unable to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRestaurants = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesSearch =
        searchTerm === "" ||
        restaurant.name.toLowerCase().includes(searchTerm) ||
        restaurant.email.toLowerCase().includes(searchTerm) ||
        restaurant.phoneNumber.toLowerCase().includes(searchTerm) ||
        restaurant.address.toLowerCase().includes(searchTerm);

      let matchesFilter = true;

      if (selectedFilter === "Approved") {
        matchesFilter = restaurant.isApproved;
      }

      if (selectedFilter === "Pending") {
        matchesFilter = !restaurant.isApproved;
      }

      return matchesSearch && matchesFilter;
    });
  }, [restaurants, search, selectedFilter]);

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/admin-dashboard")}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Restaurant Management
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage GrabnBite restaurants
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={loadRestaurants}
          disabled={loading}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.sectionLabel}>
            Search restaurants
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Name, email, phone or address"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* FILTER */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>
            Filter by approval
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {filters.map((filter) => {
              const selected = selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterButton,
                    selected && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selected &&
                        styles.filterButtonTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* RESULT COUNT */}
        {!loading && error === "" && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredRestaurants.length}{" "}
              {filteredRestaurants.length === 1
                ? "restaurant"
                : "restaurants"}{" "}
              found
            </Text>
          </View>
        )}

        {/* LOADING */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#F97316"
            />

            <Text style={styles.loadingText}>
              Loading restaurants...
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading && error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadRestaurants}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* EMPTY */}
        {!loading &&
          error === "" &&
          filteredRestaurants.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No restaurants found
              </Text>

              <Text style={styles.emptyText}>
                Try changing your search or approval filter.
              </Text>
            </View>
          )}

        {/* RESTAURANTS */}
        {!loading &&
          error === "" &&
          filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.restaurantId}
              restaurant={restaurant}
            />
          ))}
      </ScrollView>
    </View>
  );
}

function RestaurantCard({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  return (
    <Pressable
      style={styles.restaurantCard}
      onPress={() =>
        router.push({
          pathname: "/admin-restaurant-edit",
          params: {
            restaurantId:
              restaurant.restaurantId.toString(),
          },
        })
      }
    >
      <View style={styles.topRow}>
        <View style={styles.restaurantIcon}>
          <Text style={styles.restaurantIconText}>
            {restaurant.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.restaurantMain}>
          <Text style={styles.restaurantName}>
            {restaurant.name}
          </Text>

          <Text style={styles.restaurantEmail}>
            {restaurant.email}
          </Text>
        </View>

        <View
          style={[
            styles.approvalBadge,
            restaurant.isApproved
              ? styles.approvedBadge
              : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.approvalText,
              restaurant.isApproved
                ? styles.approvedText
                : styles.pendingText,
            ]}
          >
            {restaurant.isApproved
              ? "Approved"
              : "Pending"}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Phone
          </Text>

          <Text style={styles.detailValue}>
            {restaurant.phoneNumber}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Status
          </Text>

          <Text style={styles.detailValue}>
            {restaurant.isOpen
              ? "Open"
              : "Closed"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            ID
          </Text>

          <Text style={styles.detailValue}>
            {restaurant.restaurantId}
          </Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.detailLabel}>
          Address
        </Text>

        <Text style={styles.address}>
          {restaurant.address}
        </Text>
      </View>

      <View style={styles.editHint}>
        <Text style={styles.editHintText}>
          Tap to manage restaurant →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#12324A",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#12324A",
    alignItems: "center",
    justifyContent: "center",
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 24,
  },

  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  searchContainer: {
    marginTop: 24,
  },

  sectionLabel: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  searchInput: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#071B2C",
  },

  filterSection: {
    marginTop: 20,
  },

  filterList: {
    gap: 8,
    paddingBottom: 3,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  filterButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },

  filterButtonText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  filterButtonTextSelected: {
    color: "#FFFFFF",
  },

  resultsHeader: {
    marginTop: 24,
    marginBottom: 10,
  },

  resultsText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  restaurantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  restaurantIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#071B2C",
    alignItems: "center",
    justifyContent: "center",
  },

  restaurantIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  restaurantMain: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  restaurantName: {
    color: "#071B2C",
    fontSize: 16,
    fontWeight: "700",
  },

  restaurantEmail: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  approvalBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  approvedBadge: {
    backgroundColor: "#DCFCE7",
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  approvalText: {
    fontSize: 11,
    fontWeight: "700",
  },

  approvedText: {
    color: "#166534",
  },

  pendingText: {
    color: "#92400E",
  },

  details: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 15,
    paddingTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },

  detailItem: {
    minWidth: 90,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginBottom: 3,
  },

  detailValue: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },

  addressContainer: {
    marginTop: 14,
  },

  address: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
  },

  editHint: {
    marginTop: 15,
    alignItems: "flex-end",
  },

  editHintText: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "700",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 25,
    marginTop: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 35,
    marginTop: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyTitle: {
    color: "#071B2C",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
});