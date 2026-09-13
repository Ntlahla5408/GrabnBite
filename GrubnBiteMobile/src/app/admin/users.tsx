import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import LogoutButton from "@/components/LogoutButton";
import RoleGuard from "@/components/RoleGuard";
import { AdminUser, getUsers, updateUserRole } from "@/services/adminService";

const roles = ["customer", "restaurant", "driver", "admin"];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setError("");
      setLoading(true);
      setUsers(await getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  const saveRole = async (user: AdminUser, role: string) => {
    const userId = user.userId ?? user.id;

    try {
      setSavingUserId(userId);
      const updated = await updateUserRole(userId, { role });

      setUsers((current) =>
        current.map((item) =>
          (item.userId ?? item.id) === userId ? updated : item,
        ),
      );
    } catch (err) {
      Alert.alert(
        "Could not update role",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return `${user.firstName} ${user.lastName} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(query);
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ADMINISTRATION</Text>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>
              Assign the access each account needs.
            </Text>
          </View>
          <LogoutButton />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color="#8B8179" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users"
            placeholderTextColor="#9B9189"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FF704B" />
            <Text style={styles.muted}>Loading users...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={loadUsers}>
                  <Text style={styles.retry}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {!error && filteredUsers.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={46} color="#A9A19A" />
                <Text style={styles.emptyTitle}>No users found</Text>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const userId = user.userId ?? user.id;
                const currentRole = user.role?.toLowerCase() ?? "customer";
                const saving = savingUserId === userId;

                return (
                  <View key={userId} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                        </Text>
                      </View>
                      <View style={styles.userCopy}>
                        <Text style={styles.userName}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text style={styles.email}>{user.email}</Text>
                      </View>
                      {saving ? <ActivityIndicator color="#FF704B" /> : null}
                    </View>

                    <Text style={styles.roleLabel}>ROLE</Text>
                    <View style={styles.roleOptions}>
                      {roles.map((role) => {
                        const selected = currentRole === role;

                        return (
                          <Pressable
                            key={role}
                            disabled={saving || selected}
                            onPress={() => saveRole(user, role)}
                            style={[
                              styles.roleOption,
                              selected && styles.roleOptionSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleText,
                                selected && styles.roleTextSelected,
                              ]}
                            >
                              {role}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F4" },
  header: {
    padding: 20,
    backgroundColor: "#1B1F22",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: "#FF704B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: "#F7F2EC", fontSize: 28, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#A9A19A", fontSize: 13, marginTop: 5 },
  searchWrap: {
    margin: 16,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DDD5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1B1F22",
    outlineStyle: "none" as any,
  },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6E6A66", marginTop: 10 },
  userCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8DDD5",
    backgroundColor: "#FFFFFF",
  },
  userHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE1D5",
  },
  avatarText: { color: "#C84A32", fontSize: 18, fontWeight: "900" },
  userCopy: { flex: 1, marginLeft: 12 },
  userName: { color: "#1B1F22", fontSize: 16, fontWeight: "800" },
  email: { color: "#6E6A66", fontSize: 12, marginTop: 3 },
  roleLabel: {
    color: "#9B9189",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  roleOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8DDD5",
    backgroundColor: "#FFF9F4",
  },
  roleOptionSelected: {
    borderColor: "#FF704B",
    backgroundColor: "#FFE1D5",
  },
  roleText: { color: "#6E6A66", fontSize: 12, fontWeight: "700" },
  roleTextSelected: { color: "#C84A32" },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FDEBE7",
    marginBottom: 12,
  },
  errorText: { color: "#C84A32" },
  retry: { color: "#C84A32", fontWeight: "800", marginTop: 8 },
  empty: { alignItems: "center", padding: 40 },
  emptyTitle: {
    color: "#1B1F22",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
});
