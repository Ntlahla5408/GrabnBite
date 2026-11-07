import { router, usePathname } from "expo-router";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ComponentSize, Layout, Radius, Spacing, Typography } from "../constants/designSystem";

export default function CustomerBottomNav() {
  const pathname = usePathname();
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];

  const tabs = [
    {
      label: "Home",
      icon: "⌂",
      route: "/",
    },
    {
      label: "Cart",
      icon: "🛒",
      route: "/cart",
    },
    {
      label: "Account",
      icon: "👤",
      route: "/account",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={[styles.nav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {tabs.map((tab) => {
          const active =
            tab.route === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.route);

          return (
            <Pressable
              key={tab.route}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
              onPress={() => router.push(tab.route as any)}
            >
              <View
                style={[
                  styles.iconContainer,
                  active && { backgroundColor: colors.accentSoft },
                ]}
              >
                <Text style={[styles.icon, { color: active ? colors.accent : colors.textSecondary }]}>
                  {tab.icon}
                </Text>
              </View>

              <Text style={[styles.label, { color: active ? colors.accent : colors.textSecondary }, active && styles.activeLabel]}>
                {tab.label}
              </Text>

              {active && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Layout.screenHorizontalCompact,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
  },

  nav: {
    height: ComponentSize.navigationHeight,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: Radius.panel,
    borderWidth: 1,
  },

  tab: {
    flex: 1,
    height: ComponentSize.navigationHeight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  tabPressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 34,
    height: 28,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  activeIconContainer: {
    backgroundColor: "#FFF1E6",
  },

  icon: {
    fontSize: 18,
    color: "#7F94A3",
  },

  activeIcon: {
    color: "#F47721",
  },

  label: {
    fontSize: Typography.micro,
    fontWeight: "600",
    color: "#7F94A3",
  },

  activeLabel: {
    color: "#102A43",
    fontWeight: "800",
  },

  activeIndicator: {
    position: "absolute",
    bottom: 4,
    width: 24,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F97316",
  },
});
