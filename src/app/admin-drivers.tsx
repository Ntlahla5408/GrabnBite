import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";

const NAVY = "#071B2C";
const ORANGE = "#F97316";
const LIGHT = "#F8FAFC";

type Driver = {
  driverId: number;
  userId: number;
  vehicleType: string;
  vehicleRegistration: string;
  isOnline: boolean;
  isApproved: boolean;
  createdAt: string;
};

type Filter = "All" | "Approved" | "Pending" | "Online" | "Offline";

export default function AdminDrivers() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }

    loadDrivers();
  }, [user]);

  const loadDrivers = async () => {
    try {
      const data = await apiRequest("/api/Driver", {}, token);

      setDrivers(data);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load drivers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDrivers();
  };

  const approveDriver = async (driverId: number) => {
    try {
      setApprovingId(driverId);

      await apiRequest(
        `/api/Driver/${driverId}/approve`,
        {
          method: "PUT",
        },
        token,
      );

      Alert.alert("Success", "Driver approved successfully.");

      await loadDrivers();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to approve driver.");
    } finally {
      setApprovingId(null);
    }
  };

  const filteredDrivers = useMemo(() => {
    let result = [...drivers];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((driver) =>
        [
          driver.vehicleType,
          driver.vehicleRegistration,
          driver.driverId.toString(),
          driver.userId.toString(),
        ].some((value) => value.toLowerCase().includes(searchText)),
      );
    }

    if (filter === "Approved") {
      result = result.filter((driver) => driver.isApproved);
    }

    if (filter === "Pending") {
      result = result.filter((driver) => !driver.isApproved);
    }

    if (filter === "Online") {
      result = result.filter((driver) => driver.isOnline);
    }

    if (filter === "Offline") {
      result = result.filter((driver) => !driver.isOnline);
    }

    return result;
  }, [drivers, search, filter]);

  const renderDriver = ({ item }: { item: Driver }) => {
    const isApproving = approvingId === item.driverId;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.vehicleType}>{item.vehicleType}</Text>

            <Text style={styles.registration}>{item.vehicleRegistration}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.isOnline ? styles.onlineBadge : styles.offlineBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                item.isOnline ? styles.onlineDot : styles.offlineDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                item.isOnline ? styles.onlineText : styles.offlineText,
              ]}
            >
              {item.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Driver ID</Text>
          <Text style={styles.infoValue}>{item.driverId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue}>{item.userId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Registered</Text>
          <Text style={styles.infoValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.approvalRow}>
          <View
            style={[
              styles.approvalBadge,
              item.isApproved ? styles.approvedBadge : styles.pendingBadge,
            ]}
          >
            <Text
              style={[
                styles.approvalText,
                item.isApproved ? styles.approvedText : styles.pendingText,
              ]}
            >
              {item.isApproved ? "Approved" : "Pending"}
            </Text>
          </View>

          {!item.isApproved && (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => approveDriver(item.driverId)}
              disabled={isApproving}
            >
              {isApproving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.approveButtonText}>Approve</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Driver Management</Text>

          <Text style={styles.headerSubtitle}>Manage and approve drivers</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{drivers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {drivers.filter((d) => d.isApproved).length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {drivers.filter((d) => !d.isApproved).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {drivers.filter((d) => d.isOnline).length}
            </Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by vehicle, registration or ID..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterContainer}>
          {(
            ["All", "Approved", "Pending", "Online", "Offline"] as Filter[]
          ).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.activeFilter,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredDrivers}
          keyExtractor={(item) => item.driverId.toString()}
          renderItem={renderDriver}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={
            filteredDrivers.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No drivers found</Text>

              <Text style={styles.emptyText}>
                Try changing your search or filter.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  header: {
    backgroundColor: NAVY,
    paddingTop: 55,
    paddingBottom: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    marginRight: 15,
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 38,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 3,
  },

  content: {
    flex: 1,
    padding: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    color: NAVY,
    fontSize: 20,
    fontWeight: "700",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    color: NAVY,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },

  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },

  activeFilter: {
    backgroundColor: NAVY,
  },

  filterText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  vehicleType: {
    color: NAVY,
    fontSize: 18,
    fontWeight: "700",
  },

  registration: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
  },

  onlineBadge: {
    backgroundColor: "#DCFCE7",
  },

  offlineBadge: {
    backgroundColor: "#F1F5F9",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  onlineDot: {
    backgroundColor: "#16A34A",
  },

  offlineDot: {
    backgroundColor: "#64748B",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  onlineText: {
    color: "#15803D",
  },

  offlineText: {
    color: "#475569",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 13,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 13,
  },

  infoValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "600",
  },

  approvalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  approvalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },

  approvedBadge: {
    backgroundColor: "#DCFCE7",
  },

  pendingBadge: {
    backgroundColor: "#FFEDD5",
  },

  approvalText: {
    fontSize: 11,
    fontWeight: "700",
  },

  approvedText: {
    color: "#15803D",
  },

  pendingText: {
    color: "#C2410C",
  },

  approveButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },

  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIGHT,
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },

  emptyTitle: {
    color: NAVY,
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },
});
