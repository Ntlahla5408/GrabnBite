import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { PdfView } from "react-native-better-pdf";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { useAuth } from "../context/authContext";
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
  const { token } = useAuth();
  const colors = AppThemeColors[theme];
  const policyId = typeof id === "string" ? Number(id) : Number.NaN;
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pageCount, setPageCount] = useState<number | null>(null);
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
      setPageCount(null);
      setIsPdfLoading(true);

      try {
        const data = await apiRequest(`/api/Policies/${policyId}`, {}, token);
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
  }, [policyId, reloadKey, token]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back to policies" onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{policy?.title ?? "Policy document"}</Text>
          {pageCount !== null ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{pageCount} pages</Text> : null}
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
          <PdfView
            key={`${policy.policyDocumentId}-${policy.version}`}
            source={{ uri: policy.fileUrl }}
            style={styles.viewer}
            fitPolicy="width"
            onLoad={({ pageCount: loadedPages }) => {
              setPageCount(loadedPages);
              setIsPdfLoading(false);
            }}
            onError={(error) => {
              if (error.page === undefined) {
                setLoadError(error.message);
              }
            }}
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
  screen: { flex: 1 },
  header: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  backButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1E6", marginRight: 10 },
  backText: { fontSize: 34, lineHeight: 38, marginTop: -4 },
  headerCopy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 3 },
  viewerContainer: { flex: 1 },
  viewer: { flex: 1, backgroundColor: "#E8EDF2" },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  message: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  messageTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  messageText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});