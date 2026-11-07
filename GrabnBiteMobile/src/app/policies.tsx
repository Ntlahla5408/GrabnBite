import { router } from "expo-router";
import {useCallback, useEffect, useState, useRef} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { apiRequest } from "../services/api";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";

interface PolicyDocument {
  policyDocumentId: number;
  title: string;
  description: string;
  fileUrl: string;
  status: string;
  effectiveDate: string | null;
  version: number;
}

export default function PoliciesScreen() {
  const { theme, isDark } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { showError } = useErrorFeedback();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPoliciesRetryRef = useRef<() => void>(() => {});

  const loadPolicies = useCallback(async () => {
    try {
      const data = await apiRequest("/api/Policies");
      setPolicies(data);
      setError("");
    } catch (loadError) {
      logAppError("Loading published policy documents", loadError);
      setError("Unable to load policy documents. Please try again.");
      showError(getUserFacingError(loadError, {
        title: "We couldn't load the policies",
        message: "Published policy documents are temporarily unavailable. Please try again.",
      }), () => { loadPoliciesRetryRef.current(); });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPoliciesRetryRef.current = () => { void loadPolicies(); };
  }, [loadPolicies]);

  useEffect(() => {
    loadPoliciesRetryRef.current();
  }, [loadPolicies]);

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
          <Text style={[styles.noticeTitle, { color: colors.text }]}>Policy documents</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            This section displays policies published by GrabnBite. Draft documents and policies that have not reached their effective date are not shown.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available documents</Text>

        {loading ? (
          <View style={styles.message}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>Loading policies…</Text>
          </View>
        ) : error ? (
          <View style={styles.message}>
            <Text style={[styles.messageText, { color: "#DC2626" }]}>{error}</Text>
            <Pressable onPress={() => { loadPoliciesRetryRef.current(); }} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : policies.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No published policies available</Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Published policy documents will appear here once they have been added by GrabnBite.
            </Text>
          </View>
        ) : (
          policies.map((policy) => (
            <Pressable
              key={policy.policyDocumentId}
              accessibilityRole="button"
              onPress={() => router.push({
                pathname: "/policy-reader",
                params: { id: String(policy.policyDocumentId) },
              })}
              style={({ pressed }) => [
                styles.policyCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={styles.policyIcon}>
                <Text style={styles.policyEmoji}>📄</Text>
              </View>
              <View style={styles.policyCopy}>
                <Text style={[styles.policyTitle, { color: colors.text }]}>{policy.title}</Text>
                <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>{policy.description}</Text>
                <Text style={[styles.policyStatus, { color: colors.accent }]}>
                  {policy.effectiveDate
                    ? `Effective ${new Date(policy.effectiveDate).toLocaleDateString()}`
                    : "Published"}
                  {policy.version > 1 ? ` · Version ${policy.version}` : ""}
                </Text>
              </View>
              <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
            </Pressable>
          ))
        )}
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
  message: { alignItems: "center", justifyContent: "center", padding: 28 },
  messageText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 10 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
});
