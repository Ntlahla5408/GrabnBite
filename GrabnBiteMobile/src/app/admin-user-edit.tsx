import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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

const ROLES = ["Customer", "Restaurant", "Driver", "Admin"];

export default function AdminUserEditScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user, token } = useAuth();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "Admin") {
      router.replace("/");
      return;
    }

    loadUser();
  }, [user, userId]);

  const loadUser = async () => {
    if (!token || !userId) return;

    try {
      setLoading(true);

      const data = await apiRequest(
        `/api/Users/${userId}`,
        {},
        token
      );

      setSelectedUser(data);

      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhoneNumber(data.phoneNumber);
      setSelectedRole(data.role);
      setIsActive(data.isActive);
    } catch (error) {
      console.error("LOAD USER ERROR:", error);

      Alert.alert(
        "Error",
        "Could not load the user."
      );

      router.back();
    } finally {
      setLoading(false);
    }
  };

  const saveDetails = async () => {
    if (!token || !selectedUser) return;

    if (!firstName.trim()) {
      Alert.alert("Validation", "First name is required.");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Validation", "Last name is required.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Validation", "Email is required.");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation", "Please enter a valid email.");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Validation", "Phone number is required.");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(
        `/api/Users/${selectedUser.userId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
          }),
        },
        token
      );

      Alert.alert(
        "Success",
        "User details updated successfully."
      );

      await loadUser();
    } catch (error) {
      console.error("UPDATE USER ERROR:", error);

      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Could not update the user."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (role: string) => {
    if (!token || !selectedUser) return;

    if (role === selectedUser.role) {
      return;
    }

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Users/${selectedUser.userId}/role`,
        {
          method: "PUT",
          body: JSON.stringify({
            role,
          }),
        },
        token
      );

      setSelectedRole(role);

      setSelectedUser({
        ...selectedUser,
        role,
      });

      Alert.alert(
        "Success",
        `User role changed to ${role}.`
      );
    } catch (error) {
      console.error("CHANGE ROLE ERROR:", error);

      Alert.alert(
        "Role Update Failed",
        error instanceof Error
          ? error.message
          : "Could not change the user's role."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!token || !selectedUser) return;

    const newStatus = !isActive;

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Users/${selectedUser.userId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: newStatus,
          }),
        },
        token
      );

      setIsActive(newStatus);

      setSelectedUser({
        ...selectedUser,
        isActive: newStatus,
      });

      Alert.alert(
        "Success",
        newStatus
          ? "User has been activated."
          : "User has been deactivated."
      );
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      Alert.alert(
        "Status Update Failed",
        error instanceof Error
          ? error.message
          : "Could not update the user's status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = () => {
    if (!token || !selectedUser) return;

    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${selectedUser.firstName} ${selectedUser.lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    if (!token || !selectedUser) return;

    try {
      setActionLoading(true);

      await apiRequest(
        `/api/Users/${selectedUser.userId}`,
        {
          method: "DELETE",
        },
        token
      );

      Alert.alert(
        "User Deleted",
        "The user has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/admin-users"),
          },
        ]
      );
    } catch (error) {
      console.error("DELETE USER ERROR:", error);

      Alert.alert(
        "Delete Failed",
        error instanceof Error
          ? error.message
          : "Could not delete the user."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>
          Loading user...
        </Text>
      </View>
    );
  }

  if (!selectedUser) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Edit User</Text>
          <Text style={styles.subtitle}>
            Manage account details and permissions
          </Text>
        </View>
      </View>

      {/* User summary */}
      <View style={styles.userSummary}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {selectedUser.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.summaryName}>
            {selectedUser.firstName} {selectedUser.lastName}
          </Text>

          <Text style={styles.summaryEmail}>
            {selectedUser.email}
          </Text>

          <View style={styles.badges}>
            <View
              style={[
                styles.statusBadge,
                isActive
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isActive
                    ? styles.activeText
                    : styles.inactiveText,
                ]}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {selectedRole}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Personal Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Personal Details
        </Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          placeholder="First name"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
          placeholder="Last name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveDetails}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Role */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          User Role
        </Text>

        <Text style={styles.sectionDescription}>
          Change what this user is allowed to access.
        </Text>

        <View style={styles.roleGrid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleOption,
                selectedRole === role &&
                  styles.selectedRoleOption,
              ]}
              onPress={() => changeRole(role)}
              disabled={actionLoading}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  selectedRole === role &&
                    styles.selectedRoleOptionText,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account Status
        </Text>

        <Text style={styles.sectionDescription}>
          Inactive users should not be able to use their
          account normally.
        </Text>

        <TouchableOpacity
          style={[
            styles.statusButton,
            isActive
              ? styles.deactivateButton
              : styles.activateButton,
          ]}
          onPress={toggleStatus}
          disabled={actionLoading}
        >
          <Text
            style={[
              styles.statusButtonText,
              isActive
                ? styles.deactivateText
                : styles.activateText,
            ]}
          >
            {isActive
              ? "Deactivate User"
              : "Activate User"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>
          Danger Zone
        </Text>

        <Text style={styles.dangerDescription}>
          Deleting this user permanently removes their
          account from the system.
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteUser}
          disabled={actionLoading}
        >
          <Text style={styles.deleteButtonText}>
            Delete User
          </Text>
        </TouchableOpacity>
      </View>

      {/* User ID */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>User ID</Text>
        <Text style={styles.infoValue}>
          {selectedUser.userId}
        </Text>

        <Text style={styles.infoLabel}>Created</Text>
        <Text style={styles.infoValue}>
          {new Date(
            selectedUser.createdAt
          ).toLocaleString()}
        </Text>

        <Text style={styles.infoLabel}>Last Updated</Text>
        <Text style={styles.infoValue}>
          {new Date(
            selectedUser.updatedAt
          ).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 24,
    paddingBottom: 50,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  backText: {
    fontSize: 32,
    color: "#071B2C",
    marginTop: -4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    color: "#64748B",
    marginTop: 4,
  },

  userSummary: {
    backgroundColor: "#071B2C",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  avatarText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "800",
  },

  summaryName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  summaryEmail: {
    color: "#CBD5E1",
    marginTop: 3,
  },

  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  activeText: {
    color: "#166534",
  },

  inactiveText: {
    color: "#991B1B",
  },

  roleBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  roleBadgeText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 6,
  },

  sectionDescription: {
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 20,
  },

  label: {
    color: "#334155",
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#071B2C",
  },

  primaryButton: {
    backgroundColor: "#F97316",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  roleOption: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
  },

  selectedRoleOption: {
    backgroundColor: "#071B2C",
    borderColor: "#071B2C",
  },

  roleOptionText: {
    color: "#334155",
    fontWeight: "600",
  },

  selectedRoleOptionText: {
    color: "#fff",
  },

  statusButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  deactivateButton: {
    backgroundColor: "#FEF3C7",
  },

  activateButton: {
    backgroundColor: "#DCFCE7",
  },

  statusButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },

  deactivateText: {
    color: "#92400E",
  },

  activateText: {
    color: "#166534",
  },

  dangerSection: {
    backgroundColor: "#FFF7F7",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },

  dangerTitle: {
    color: "#991B1B",
    fontSize: 19,
    fontWeight: "800",
  },

  dangerDescription: {
    color: "#7F1D1D",
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },

  deleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  infoSection: {
    padding: 10,
    marginBottom: 20,
  },

  infoLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 10,
  },

  infoValue: {
    color: "#475569",
    marginTop: 2,
  },
});