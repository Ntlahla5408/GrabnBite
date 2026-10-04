import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const logo = require("../../../assets/images/GrabnbiteLogo.jpg");

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Image source={logo} style={styles.logoImage} />

        <View>
          <Text style={styles.logoText}>GrabnBite</Text>

          <Text style={styles.tagline}>Your next meal starts here.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.cartButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
          ]}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: "#071B2C",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 10,
  },

  logoText: {
    color: "#F97316",
    fontSize: 22,
    fontWeight: "800",
  },

  tagline: {
    marginTop: 2,
    color: "#AFC0CC",
    fontSize: 11,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    justifyContent: "center",
    alignItems: "center",
  },

  cartIcon: {
    fontSize: 19,
  },

  loginButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  loginButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
