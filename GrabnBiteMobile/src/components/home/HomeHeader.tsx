import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { AppThemeColors, useThemePreference } from "../../context/ThemeContext";
import { useAuth } from "../../context/authContext";
import { getCart } from "../../services/cartService";

const logo = require("../../../assets/images/inside-icon.png");

export default function HomeHeader() {
  const { theme } = useThemePreference();
  const { user, token, loading } = useAuth();
  const colors = AppThemeColors[theme];
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [restaurantCount, setRestaurantCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadCartRestaurantCount() {
        if (!token || user?.role?.trim().toLowerCase() !== "customer") {
          setRestaurantCount(0);
          return;
        }

        try {
          const carts = await getCart(token);
          const count = carts.filter((cart) => cart.items.length > 0).length;

          if (isActive) {
            setRestaurantCount(count);
          }
        } catch (error) {
          console.error("Failed to load cart count:", error);
        }
      }

      void loadCartRestaurantCount();

      return () => {
        isActive = false;
      };
    }, [token, user?.role]),
  );
  return (
    <View style={[styles.container, isCompact && styles.compactContainer, { backgroundColor: colors.header }]}>
      <View style={styles.brandContainer}>
        <Image source={logo} style={[styles.logoImage, isCompact && styles.compactLogo]} resizeMode="contain" />

        <View>
          <Text numberOfLines={1} style={[styles.logoText, isCompact && styles.compactLogoText, { color: colors.accent }]}>GrabnBite</Text>

          {!isCompact && (
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your next meal starts here.</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {(!user || user.role.trim().toLowerCase() === "customer") && (
        <Pressable
          style={({ pressed }) => [
            isCompact && styles.compactCartButton,
            styles.cartButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/cart")}
        >
          <Text style={[styles.cartIcon, { color: colors.text }]}>🛒</Text>
          {restaurantCount > 0 && (
            <View
              style={styles.cartBadge}
              accessibilityLabel={`${restaurantCount} restaurants in cart`}
            >
              <Text style={styles.cartBadgeText}>
                {restaurantCount > 99 ? "99+" : restaurantCount}
              </Text>
            </View>
          )}
        </Pressable>
        )}

        {!loading && !user && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create an account"
            style={({ pressed }) => [
              isCompact && styles.compactSignUpButton,
              styles.signUpButton,
              pressed && styles.signUpButtonPressed,
            ]}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  logoImage: {
    width: 42,
    height: 42,
    marginRight: 8,
    backgroundColor: "transparent",
  },

  logoText: {
    color: "#F97316",
    fontSize: 20,
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
    gap: 8,
  },

  compactContainer: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 8,
  },

  compactLogo: {
    width: 34,
    height: 34,
    marginRight: 7,
  },

  compactLogoText: {
    fontSize: 17,
  },

  compactCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  compactSignUpButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cartIcon: {
    fontSize: 19,
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#F97316",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },

  signUpButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  signUpText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  signUpButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
