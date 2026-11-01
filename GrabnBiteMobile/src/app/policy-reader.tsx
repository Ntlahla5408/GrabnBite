import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PdfView } from "react-native-better-pdf";
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
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const policy = typeof id === "string" ? policyDocuments[id] : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View
        style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to policies"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.text }]}
          >
            {policy?.title ?? "Policy document"}
          </Text>
          {pageCount !== null ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {pageCount} pages
            </Text>
          ) : null}
        </View>
      </View>

      {!policy ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>
            Document not found
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            Return to Legal and Policies and select a document from the list.
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>
            Unable to open this document
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            {loadError}
          </Text>
          <Pressable
            onPress={() => {
              setLoadError(null);
              setIsLoading(true);
            }}
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.viewerContainer}>
          <PdfView
            key={policy.source}
            source={policy.source}
            style={styles.viewer}
            fitPolicy="width"
            onLoad={({ pageCount: loadedPages }) => {
              setPageCount(loadedPages);
              setIsLoading(false);
              setLoadError(null);
            }}
            onError={(error) => {
              if (error.page === undefined) {
                setIsLoading(false);
                setLoadError(error.message);
              }
            }}
          />
          {isLoading ? (
            <View
              style={[
                styles.loadingOverlay,
                { backgroundColor: colors.background },
              ]}
            >
              <ActivityIndicator size="large" color={colors.accent} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Opening document…
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
    marginRight: 10,
  },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 3 },
  viewerContainer: { flex: 1 },
  viewer: { flex: 1, backgroundColor: "#E8EDF2" },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { fontSize: 12, marginTop: 10 },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  messageTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});
