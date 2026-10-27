import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

export default function SettingsScreen() {
  const { theme, isDark, isLoaded, toggleTheme } = useThemePreference();
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
            <Text style={[styles.title, { color: colors.headerText }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Personalise your GrabnBite experience</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
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
              trackColor={{ false: "#CBD5E1", true: "#F97316" }} thumbColor="#FFFFFF" />
          </View>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Your choice is saved on this device and restored when you reopen GrabnBite.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 40 },
  header: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(249, 115, 22, 0.12)", marginRight: 12 },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  preferenceCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center" },
  preferenceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", marginRight: 12 },
  preferenceEmoji: { fontSize: 22 },
  preferenceCopy: { flex: 1, marginRight: 10 },
  preferenceTitle: { fontSize: 15, fontWeight: "800" },
  preferenceDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  helpText: { fontSize: 12, lineHeight: 18, marginTop: 12 },
});
