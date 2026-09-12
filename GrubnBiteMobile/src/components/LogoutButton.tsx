import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { logout } from "@/services/sessionService";

export default function LogoutButton() {
  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);

              Alert.alert(
                "Logout failed",
                "We could not log you out. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Pressable style={styles.button} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
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