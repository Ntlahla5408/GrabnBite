import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.logo}>GrabnBite</Text>
        <Text style={styles.tagline}>Good food. Delivered.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </Pressable>

        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginText}>Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F97316",
  },

  tagline: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  cartIcon: {
    fontSize: 20,
  },

  loginButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
