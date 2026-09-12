import { Ionicons } from "@expo/vector-icons";
import { Slot, router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FoodColors } from "@/constants/theme";

const navigationItems = [
  { label: "Home", path: "/", icon: "home-outline", activeIcon: "home" },
  {
    label: "Orders",
    path: "/orders",
    icon: "receipt-outline",
    activeIcon: "receipt",
  },
  {
    label: "Cart",
    path: "/cart",
    icon: "bag-outline",
    activeIcon: "bag",
  },
  {
    label: "Account",
    path: "/account",
    icon: "person-outline",
    activeIcon: "person",
  },
] as const;

const hiddenNavigationPrefixes = [
  "/login",
  "/register",
  "/admin",
  "/driver",
  "/restaurant-dashboard",
  "/restaurant-admin",
];

function isNavigationHidden(pathname: string) {
  return hiddenNavigationPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isActivePath(pathname: string, path: string) {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export default function CustomAppShell() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hideNavigation = isNavigationHidden(pathname);

  return (
    <View style={styles.shell}>
      <View style={styles.content}>
        <Slot />
      </View>

      {!hideNavigation && (
        <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.navBar}>
            {navigationItems.map((item) => {
              const active = isActivePath(pathname, item.path);
              const iconName = active ? item.activeIcon : item.icon;

              return (
                <Pressable
                  key={item.path}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                  onPress={() => router.push(item.path as never)}
                  style={({ pressed }) => [
                    styles.navItem,
                    pressed && styles.navItemPressed,
                  ]}
                >
                  <View style={[styles.iconBubble, active && styles.activeBubble]}>
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={21}
                      color={active ? FoodColors.tomato : FoodColors.muted}
                    />
                  </View>
                  <Text style={[styles.navLabel, active && styles.activeLabel]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: FoodColors.oat,
  },
  content: {
    flex: 1,
  },
  navWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: FoodColors.oat,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: 68,
    borderRadius: 22,
    paddingHorizontal: 5,
    backgroundColor: FoodColors.surface,
    borderWidth: 1,
    borderColor: FoodColors.line,
    shadowColor: FoodColors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    gap: 3,
  },
  navItemPressed: {
    opacity: 0.65,
  },
  iconBubble: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  activeBubble: {
    backgroundColor: FoodColors.peach,
  },
  navLabel: {
    color: FoodColors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  activeLabel: {
    color: FoodColors.tomato,
  },
});
