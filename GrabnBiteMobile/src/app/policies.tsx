import { router } from "expo-router";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

const policies = [
  {
    id: "terms",
    title: "Terms and Conditions of Use",
    description: "The terms governing use of the GrabnBite platform.",
    icon: "📄",
    status: "Draft for legal review",
  },
  {
    id: "cancellation",
    title: "Cancellation Policy",
    description: "Conditions and procedures for cancelling orders.",
    icon: "↩️",
    status: "Effective date to be confirmed",
  },
  {
    id: "complaints",
    title: "Customer Complaints and Dispute Resolution",
    description: "How customers can raise complaints and resolve disputes.",
    icon: "💬",
    status: "Effective 1 November 2026",
  },
  {
    id: "food-delivery",
    title: "Food Ordering and Delivery Policy",
    description: "Rules and expectations for food orders and delivery.",
    icon: "🛵",
    status: "Effective date to be confirmed",
  },
  {
    id: "payment",
    title: "Payment Policy",
    description: "Payment terms and conditions for GrabnBite orders.",
    icon: "💳",
    status: "Effective 1 November 2026",
  },
  {
    id: "account",
    title: "Account Suspension and Termination Policy",
    description: "Circumstances in which account access may be restricted or ended.",
    icon: "🔒",
    status: "Effective 1 November 2026",
  },
] as const;

export default function PoliciesScreen() {
  const { theme, isDark } = useThemePreference();
  const colors = AppThemeColors[theme];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.accent }]}>Legal and Policies</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>GrabnBite policy documents</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.notice, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>Please note</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            These documents are provided as supplied. The Terms and Conditions document is marked as a draft for legal review, and some policies still have an effective date to be confirmed.
          </Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary, marginTop: 8 }]}>
            A separate Privacy Policy and Refund and Returns Policy are not included in this document centre.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available documents</Text>
        {policies.map((policy) => (
          <Pressable
            key={policy.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/policy-reader", params: { id: policy.id } })}
            style={({ pressed }) => [
              styles.policyCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={styles.policyIcon}>
              <Text style={styles.policyEmoji}>{policy.icon}</Text>
            </View>
            <View style={styles.policyCopy}>
              <Text style={[styles.policyTitle, { color: colors.text }]}>{policy.title}</Text>
              <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>{policy.description}</Text>
              <Text style={[styles.policyStatus, { color: colors.accent }]}>{policy.status}</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 24, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1E6", marginRight: 12 },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 25, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 24 },
  noticeTitle: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
  policyCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  policyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#FFF1E6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  policyEmoji: { fontSize: 20 },
  policyCopy: { flex: 1 },
  policyTitle: { fontSize: 14, fontWeight: "800" },
  policyDescription: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  policyStatus: { fontSize: 11, fontWeight: "700", marginTop: 6 },
  arrow: { fontSize: 26, marginLeft: 8 },
});
