import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { apiRequest } from "../services/api";

interface PolicyDocument {
  policyDocumentId: number;
  title: string;
  description: string;
  fileUrl: string;
  version: number;
}

export default function PolicyReaderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme, isDark } = useThemePreference();
  const colors = AppThemeColors[theme];
  const policyId = typeof id === "string" ? Number(id) : Number.NaN;
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadPolicy() {
      if (!Number.isInteger(policyId) || policyId <= 0) {
        setPolicy(null);
        setLoadError("A valid policy document was not selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      setIsPdfLoading(true);

      try {
        const data = await apiRequest(`/api/Policies/${policyId}`);
        if (isActive) {
          setPolicy(data);
        }
      } catch (error) {
        if (isActive) {
          setPolicy(null);
          setLoadError(error instanceof Error ? error.message : "Unable to load this policy document.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPolicy();
    return () => { isActive = false; };
  }, [policyId, reloadKey]);

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

      {isLoading ? (
        <View style={styles.message}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>Loading policy document…</Text>
        </View>
      ) : loadError || !policy ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>Unable to open this document</Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>{loadError ?? "Document not found."}</Text>
          <Pressable onPress={() => setReloadKey((current) => current + 1)} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.viewerContainer}>
          <iframe
            key={`${policy.policyDocumentId}-${policy.version}-${reloadKey}`}
            title={policy.title}
            src={policy.fileUrl}
            style={styles.pdfFrame}
            onLoad={() => setIsPdfLoading(false)}
            onError={() => setLoadError("Your browser could not load this PDF. Please try again later.")}
          />
          {isPdfLoading ? (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.messageText, { color: colors.textSecondary }]}>Opening PDF…</Text>
            </View>
          ) : null}
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
  message: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  messageTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  messageText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});