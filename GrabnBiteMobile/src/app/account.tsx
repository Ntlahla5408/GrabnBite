import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CustomerBottomNav from "../components/CustomerBottomNav";
import { useAuth } from "../context/authContext";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loggedOutContainer}>
          <Text style={styles.icon}>👤</Text>

          <Text style={styles.title}>Welcome to GrabnBite</Text>

          <Text style={styles.subtitle}>
            Sign in to manage your account, orders and addresses.
          </Text>

          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>

        <CustomerBottomNav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
          <Text style={styles.headerSubtitle}>
            Manage your GrabnBite account
          </Text>
        </View>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.firstName?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>

            <Text style={styles.email}>{user.email}</Text>

            <Text style={styles.role}>Customer</Text>
          </View>
        </View>

        {/* Account options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My GrabnBite</Text>

          <Pressable
            style={styles.option}
            onPress={() => router.push("/orders")}
          >
            <View style={styles.optionIcon}>
              <Text>📦</Text>
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>My Orders</Text>
              <Text style={styles.optionSubtitle}>
                View your current and previous orders
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.option}
            onPress={() => router.push("/addresses")}
          >
            <View style={styles.optionIcon}>
              <Text>📍</Text>
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>My Addresses</Text>
              <Text style={styles.optionSubtitle}>
                Manage your delivery addresses
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
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

  content: {
    paddingBottom: 120,
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    marginTop: 5,
  },

  profileCard: {
    marginHorizontal: 20,
    marginTop: -18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
  },

  email: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  role: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  option: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "800",
  },

  optionSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: "#94A3B8",
    fontSize: 28,
    marginLeft: 8,
  },

  logoutButton: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  loggedOutContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 90,
  },

  icon: {
    fontSize: 55,
    marginBottom: 18,
  },

  title: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 400,
  },

  loginButton: {
    backgroundColor: "#F97316",
    borderRadius: 11,
    paddingHorizontal: 35,
    paddingVertical: 14,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
