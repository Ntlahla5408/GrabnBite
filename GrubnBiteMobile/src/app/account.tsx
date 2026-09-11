import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LogoutButton from "@/components/LogoutButton";
import RoleGuard from "@/components/RoleGuard";
import { getCurrentUser } from "@/services/sessionService";

export default function AccountScreen() {
  const user = getCurrentUser();

  return (
    <RoleGuard allowedRoles={["customer", "user"]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>

          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>

          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/addresses")}
          >
            <View style={styles.rowIcon}>
              <Ionicons
                name="location-outline"
                size={21}
                color="#1A4B6B"
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>My Addresses</Text>
              <Text style={styles.rowSubtitle}>
                Manage your delivery addresses
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#94A3B8"
            />
          </Pressable>
        </View>

        <View style={styles.logoutSection}>
          <LogoutButton />
        </View>
      </ScrollView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#1A4B6B",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  email: {
    marginTop: 5,
    color: "#64748B",
  },

  section: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    marginLeft: 12,
  },

  rowTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#071B2C",
  },

  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  logoutSection: {
    marginHorizontal: 16,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
});