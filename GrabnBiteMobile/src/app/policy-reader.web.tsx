import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

const policyDocuments: Record<string, { title: string; source: number }> = {
  terms: {
    title: "Terms and Conditions of Use",
    source: require("../../assets/policies/GrubnBite_Terms_and_Conditions_of_Use.pdf"),
  },
  cancellation: {
    title: "Cancellation Policy",
    source: require("../../assets/policies/GrubnBite_Cancellation_Policy.pdf"),
  },
  complaints: {
    title: "Customer Complaints and Dispute Resolution",
    source: require("../../assets/policies/GrubnBite_Customer_Complaints_and_Dispute_Resolution_Policy.pdf"),
  },
  "food-delivery": {
    title: "Food Ordering and Delivery Policy",
    source: require("../../assets/policies/GrubnBite_Food_Ordering_and_Delivery_Policy.pdf"),
  },
  payment: {
    title: "Payment Policy",
    source: require("../../assets/policies/GrubnBite_Payment_Policy.pdf"),
  },
  account: {
    title: "Account Suspension and Termination Policy",
    source: require("../../assets/policies/GrubnBite_Account_Suspension_and_Termination_Policy.pdf"),
  },
};

export default function PolicyReaderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme, isDark } = useThemePreference();
  const colors = AppThemeColors[theme];
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const policy = typeof id === "string" ? policyDocuments[id] : undefined;
  const pdfUri = policy ? Image.resolveAssetSource(policy.source)?.uri : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back to policies" onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{policy?.title ?? "Policy document"}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>PDF document</Text>
        </View>
      </View>

      {!policy ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>Document not found</Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>Return to Legal and Policies and select a document from the list.</Text>
        </View>
      ) : !pdfUri || loadError ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>Unable to open this document</Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>{loadError ?? "The PDF file could not be located in the web build."}</Text>
          <Pressable onPress={() => { setLoadError(null); setIsLoading(true); setReloadKey((current) => current + 1); }} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.viewerContainer}>
          {isLoading ? (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Opening document…</Text>
            </View>
          ) : null}
          <iframe
            key={reloadKey}
            title={policy.title}
            src={pdfUri}
            style={styles.pdfFrame}
            onLoad={() => { setIsLoading(false); setLoadError(null); }}
            onError={() => { setIsLoading(false); setLoadError("Your browser could not load this PDF. Try opening it in a new browser tab."); }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: "100vh" },
  header: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  backButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1E6", marginRight: 10 },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 3 },
  viewerContainer: { flex: 1, minHeight: 0, position: "relative", backgroundColor: "#E8EDF2" },
  pdfFrame: { border: 0, width: "100%", height: "100%", minHeight: "70vh", backgroundColor: "#E8EDF2" },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", zIndex: 1 },
  loadingText: { fontSize: 12, marginTop: 10 },
  message: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  messageTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  messageText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});
