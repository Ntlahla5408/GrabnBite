import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import LogoutButton from "@/components/LogoutButton";
import RoleGuard from "@/components/RoleGuard";
import { FoodColors } from "@/constants/theme";
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
                color={FoodColors.tomato}
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
              color={FoodColors.muted}
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
    backgroundColor: FoodColors.oat,
  },

  header: {
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
    backgroundColor: FoodColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: FoodColors.line,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: FoodColors.tomato,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: FoodColors.onDark,
    fontSize: 30,
    fontWeight: "800",
  },

  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: FoodColors.ink,
  },

  email: {
    marginTop: 5,
    color: FoodColors.muted,
  },

  section: {
    margin: 16,
    backgroundColor: FoodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FoodColors.line,
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
    backgroundColor: FoodColors.peach,
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
    color: FoodColors.ink,
  },

  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: FoodColors.muted,
  },

  logoutSection: {
    marginHorizontal: 16,
    paddingHorizontal: 15,
    backgroundColor: FoodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FoodColors.tomatoDark,
  },
});