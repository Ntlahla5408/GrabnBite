import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { useAuth } from "../context/authContext";

export default function SettingsScreen() {
  const { theme, isDark, isLoaded, toggleTheme } = useThemePreference();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }
  const colors = AppThemeColors[theme];

  if (!isLoaded) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color="#F97316" /></View>;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: colors.header }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.accent }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Personalise your GrabnBite experience</Text>
          </View>
        </View>
        {user?.role === "Restaurant" ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Restaurant Management</Text>
            <SettingsLink icon="🏠" title="Restaurant Profile" description="Update your restaurant details and profile picture" onPress={() => router.push("/restaurant-profile")} colors={colors} />
            <SettingsLink icon="🍽️" title="Manage Menu" description="Add, edit or remove menu items and pictures" onPress={() => router.push("/restaurant-menu")} colors={colors} />
            <SettingsLink icon="📂" title="Manage Menu Categories" description="Create, rename or remove menu categories" onPress={() => router.push("/restaurant-categories")} colors={colors} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Appearance</Text>
          <View style={[styles.preferenceCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.preferenceIcon}><Text style={styles.preferenceEmoji}>{isDark ? "🌙" : "☀️"}</Text></View>
            <View style={styles.preferenceCopy}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>Dark navy theme</Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                {isDark ? "Dark navy backgrounds are enabled." : "White backgrounds are enabled."}
              </Text>
            </View>
            <Switch accessibilityRole="switch" accessibilityLabel="Toggle dark navy theme" value={isDark}
              onValueChange={() => void toggleTheme()}
              trackColor={{ false: "#CBD5E1", true: colors.accent }} thumbColor="#FFFFFF" />
          </View>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Your choice is saved on this device and restored when you reopen GrabnBite.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Legal</Text>
          <SettingsLink icon="📄" title="Legal and Policies" description="Read GrabnBite's policy documents" onPress={() => router.push("/policies")} colors={colors} />
        </View>

        <View style={styles.section}>
          <Pressable accessibilityRole="button" onPress={() => void handleLogout()}
            style={[styles.logoutButton, { backgroundColor: colors.surfaceElevated, borderColor: "#DC2626" }]}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsLink({ icon, title, description, onPress, colors }: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  colors: (typeof AppThemeColors)[keyof typeof AppThemeColors];
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={[styles.linkCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.linkIcon}><Text style={styles.linkEmoji}>{icon}</Text></View>
      <View style={styles.linkCopy}>
        <Text style={[styles.linkTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.linkDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Text style={[styles.linkArrow, { color: colors.accent }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 40 },
  header: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1E6", marginRight: 12 },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  preferenceCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center" },
  preferenceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF1E6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  preferenceEmoji: { fontSize: 22 },
  preferenceCopy: { flex: 1, marginRight: 10 },
  preferenceTitle: { fontSize: 15, fontWeight: "800" },
  preferenceDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  helpText: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  linkCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  linkIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#FFF1E6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  linkEmoji: { fontSize: 20 },
  linkCopy: { flex: 1 },
  linkTitle: { fontSize: 14, fontWeight: "800" },
  linkDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  linkArrow: { fontSize: 26, marginLeft: 8 },
  logoutButton: { minHeight: 50, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  logoutText: { color: "#DC2626", fontSize: 15, fontWeight: "800" },
});
