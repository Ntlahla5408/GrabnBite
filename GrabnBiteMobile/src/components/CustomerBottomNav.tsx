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
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
              onPress={() => router.push(tab.route as any)}
            >
              <View
                style={[
                  styles.iconContainer,
                  active && styles.activeIconContainer,
                ]}
              >
                <Text style={[styles.icon, active && styles.activeIcon]}>
                  {tab.icon}
                </Text>
              </View>

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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#071B2C",
    borderTopWidth: 1,
    borderTopColor: "#18384D",
  },

  nav: {
    height: 64,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#0D2638",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#18384D",
  },

  tab: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  tabPressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 36,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  activeIconContainer: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },

  icon: {
    fontSize: 20,
    color: "#7F94A3",
  },

  activeIcon: {
    color: "#F97316",
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7F94A3",
  },

  activeLabel: {
    color: "#FFFFFF",
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
