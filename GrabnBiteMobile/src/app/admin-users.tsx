import { TouchableOpacity } from "react-native";
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


interface AdminUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roles = ["All", "Customer", "Restaurant", "Driver", "Admin"];

export default function AdminUsersScreen() {
  const { user, token } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
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

    loadUsers();
  }, [user]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/Users", {}, token);

      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return users.filter((currentUser) => {
      const matchesSearch =
        searchTerm === "" ||
        currentUser.firstName.toLowerCase().includes(searchTerm) ||
        currentUser.lastName.toLowerCase().includes(searchTerm) ||
        currentUser.email.toLowerCase().includes(searchTerm) ||
        currentUser.phoneNumber.toLowerCase().includes(searchTerm);

      const matchesRole =
        selectedRole === "All" || currentUser.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, search, selectedRole]);

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/admin-dashboard")}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>User Management</Text>

          <Text style={styles.headerSubtitle}>Manage GrabnBite accounts</Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={loadUsers}
          disabled={loading}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search users</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Name, email or phone number"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Role filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by role</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roleList}
          >
            {roles.map((role) => {
              const selected = selectedRole === role;

              return (
                <Pressable
                  key={role}
                  style={[
                    styles.roleButton,
                    selected && styles.roleButtonSelected,
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      selected && styles.roleButtonTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results count */}
        {!loading && error === "" && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"} found
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F97316" />

            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.retryButton} onPress={loadUsers}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty */}
        {!loading && error === "" && filteredUsers.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No users found</Text>

            <Text style={styles.emptyText}>
              Try changing your search or role filter.
            </Text>
          </View>
        )}

        {/* User list */}
        {!loading &&
          error === "" &&
          filteredUsers.map((currentUser) => (
            <UserCard key={currentUser.userId} user={currentUser} />
          ))}
      </ScrollView>
    </View>
  );
}

function UserCard({ user }: { user: AdminUser }) {
  return (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/admin-user-edit",
          params: {
            userId: user.userId.toString(),
          },
        })
      }
    >
      <View style={styles.userTopRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userMain}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>

          <Text style={styles.userEmail}>
            {user.email}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            user.isActive
              ? styles.activeBadge
              : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              user.isActive
                ? styles.activeText
                : styles.inactiveText,
            ]}
          >
            {user.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Role</Text>

          <Text style={styles.detailValue}>
            {user.role}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Phone</Text>

          <Text style={styles.detailValue}>
            {user.phoneNumber}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>User ID</Text>

          <Text style={styles.detailValue}>
            {user.userId}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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

  searchLabel: {
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

  filterLabel: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  roleList: {
    gap: 8,
    paddingBottom: 3,
  },

  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  roleButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },

  roleButtonText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  roleButtonTextSelected: {
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

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 12,
  },

  userTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#071B2C",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  userMain: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  userName: {
    color: "#071B2C",
    fontSize: 16,
    fontWeight: "700",
  },

  userEmail: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  activeText: {
    color: "#166534",
  },

  inactiveText: {
    color: "#991B1B",
  },

  userDetails: {
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
