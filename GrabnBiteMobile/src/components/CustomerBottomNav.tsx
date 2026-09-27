import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function CustomerBottomNav() {
  const pathname = usePathname();

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
    <View style={styles.container}>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const active =
            tab.route === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.route);

          return (
            <Pressable
              key={tab.route}
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
            >
              <Text style={[styles.icon, active && styles.activeIcon]}>
                {tab.icon}
              </Text>

              <Text style={[styles.label, active && styles.activeLabel]}>
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
    backgroundColor: "#071B2C",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingBottom: 8,
  },

  nav: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  tab: {
    flex: 1,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  icon: {
    fontSize: 22,
    color: "#94A3B8",
    marginBottom: 3,
  },

  activeIcon: {
    color: "#F97316",
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  activeLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F97316",
  },
});
