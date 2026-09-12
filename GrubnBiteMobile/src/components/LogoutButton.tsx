import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { logout } from "@/services/sessionService";

export default function LogoutButton() {
  const handleLogout = async () => {
    console.log("LOGOUT 1: Button pressed");

    try {
      console.log("LOGOUT 2: Clearing session");

      await logout();

      console.log("LOGOUT 3: Session cleared");
    } catch (error) {
      console.error("LOGOUT 2 ERROR:", error);
    }

    console.log("LOGOUT 4: Going to login");

    router.replace("/login");

    console.log("LOGOUT 5: router.replace called");
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handleLogout}
    >
      <Ionicons
        name="log-out-outline"
        size={20}
        color="#DC2626"
      />

      <Text style={styles.text}>Log out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },

  text: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },
});