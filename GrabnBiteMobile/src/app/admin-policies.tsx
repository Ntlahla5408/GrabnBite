import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { apiRequest } from "../services/api";

interface PolicyDocument {
  policyDocumentId: number;
  title: string;
  description: string;
  fileUrl: string;
  originalFileName: string;
  status: "Draft" | "Published" | "Archived";
  audience: "Customer" | "Driver" | "Restaurant" | "All";
  effectiveDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string | null;
}

interface PickedPdf {
  uri: string;
  name: string;
  size?: number;
}

export default function AdminPoliciesScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const { theme, isDark } = useThemePreference();
  const colors = AppThemeColors[theme];

  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [audience, setAudience] = useState<"Customer" | "Driver" | "Restaurant" | "All">("Customer");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [pickedPdf, setPickedPdf] = useState<PickedPdf | null>(null);

  const loadPolicies = useCallback(async () => {
    try {
      const data = await apiRequest("/api/Policies/admin", {}, token);
      setPolicies(data);
      setError("");
    } catch (loadError) {
      console.error("Failed to load policy documents:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load policy documents.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load admin policy data after the role check.
    void loadPolicies();
  }, [user, authLoading, loadPolicies]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStatus("Draft");
    setAudience("Customer");
    setEffectiveDate("");
    setPickedPdf(null);
  }

  function beginEdit(policy: PolicyDocument) {
    setEditingId(policy.policyDocumentId);
    setTitle(policy.title);
    setDescription(policy.description);
    setStatus(policy.status === "Published" ? "Published" : "Draft");
    setAudience(policy.audience || "Customer");
    setEffectiveDate(policy.effectiveDate ? policy.effectiveDate.slice(0, 10) : "");
    setPickedPdf(null);
  }

  async function choosePdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith(".pdf")) {
        Alert.alert("PDF required", "Please select a PDF document.");
        return;
      }

      setPickedPdf({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
      });
    } catch (pickerError) {
      Alert.alert(
        "Unable to select document",
        pickerError instanceof Error ? pickerError.message : "Please try selecting the PDF again.",
      );
    }
  }

  async function createFormData(): Promise<FormData> {
    const formData = new FormData();
    formData.append("Title", title.trim());
    formData.append("Description", description.trim());
    formData.append("Status", status);
    formData.append("Audience", audience);

    if (effectiveDate.trim()) {
      formData.append(
        "EffectiveDate",
        new Date(`${effectiveDate}T00:00:00.000Z`).toISOString(),
      );
    }

    if (pickedPdf) {
      if (Platform.OS === "web") {
        const fileResponse = await fetch(pickedPdf.uri);
        if (!fileResponse.ok) {
          throw new Error("The selected PDF could not be read. Please select it again.");
        }
        const blob = await fileResponse.blob();
        formData.append(
          "PdfFile",
          new File([blob], pickedPdf.name, { type: "application/pdf" }),
        );
      } else {
        formData.append("PdfFile", {
          uri: pickedPdf.uri,
          name: pickedPdf.name,
          type: "application/pdf",
        } as any);
      }
    }

    return formData;
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing information", "Enter a policy title and description.");
      return;
    }

    if (editingId === null && !pickedPdf) {
      Alert.alert("PDF required", "Select the PDF document you want to upload.");
      return;
    }

    setSaving(true);
    try {
      const formData = await createFormData();
      const endpoint = editingId === null
        ? "/api/Policies"
        : `/api/Policies/${editingId}`;

      await apiRequest(
        endpoint,
        {
          method: editingId === null ? "POST" : "PUT",
          body: formData,
        },
        token,
      );

      resetForm();
      await loadPolicies();
      Alert.alert(
        "Policy saved",
        editingId === null
          ? "The policy document has been added."
          : "The policy document has been updated.",
      );
    } catch (saveError) {
      console.error("Failed to save policy:", saveError);
      Alert.alert(
        "Unable to save policy",
        saveError instanceof Error ? saveError.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archivePolicy(policy: PolicyDocument) {
    try {
      await apiRequest(
        `/api/Policies/${policy.policyDocumentId}`,
        { method: "DELETE" },
        token,
      );
      if (editingId === policy.policyDocumentId) {
        resetForm();
      }
      await loadPolicies();
    } catch (archiveError) {
      Alert.alert(
        "Unable to archive policy",
        archiveError instanceof Error ? archiveError.message : "Please try again.",
      );
    }
  }

  function confirmArchive(policy: PolicyDocument) {
    const message = `"${policy.title}" will be removed from the customer policy list. Its record and PDF will be retained.`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Archive policy?\n\n${message}`)) {
        void archivePolicy(policy);
      }
      return;
    }

    Alert.alert(
      "Archive policy?",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => { void archivePolicy(policy); } },
      ],
    );
  }

  if (authLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Pressable onPress={() => router.replace("/admin-dashboard")} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.headerText }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Policy Management</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage policies by intended audience</Text>
        </View>
        <Pressable onPress={() => { void loadPolicies(); }} disabled={loading}>
          <Text style={[styles.refreshText, { color: colors.headerText }]}>↻</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.formCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {editingId === null ? "Add a policy" : "Update policy"}
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Policy title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Terms and Conditions of Use"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            maxLength={180}
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Briefly explain what this policy covers"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.descriptionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Who does this policy apply to?</Text>
          <View style={styles.statusRow}>
            {(["Customer", "Driver", "Restaurant", "All"] as const).map((option) => {
              const selected = audience === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setAudience(option)}
                  style={[
                    styles.statusButton,
                    { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.background },
                  ]}
                >
                  <Text style={{ color: selected ? "#FFFFFF" : colors.text, fontWeight: "700" }}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            All makes this document applicable to customers, drivers and restaurant partners. Choose the audience after reviewing the actual policy contents.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>PDF document</Text>
          <Pressable
            onPress={() => { void choosePdf(); }}
            style={[styles.fileButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Text style={[styles.fileButtonText, { color: colors.accent }]}>
              {pickedPdf ? "Choose a different PDF" : editingId === null ? "Select PDF" : "Replace current PDF (optional)"}
            </Text>
          </Pressable>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {pickedPdf
              ? `${pickedPdf.name}${pickedPdf.size ? ` · ${(pickedPdf.size / (1024 * 1024)).toFixed(2)} MB` : ""}`
              : editingId === null
                ? "PDF only · Maximum 10 MB"
                : "Leave empty to keep the existing PDF."}
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Effective date (optional)</Text>
          <TextInput
            value={effectiveDate}
            onChangeText={setEffectiveDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            autoCapitalize="none"
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Publication status</Text>
          <View style={styles.statusRow}>
            {(["Draft", "Published"] as const).map((option) => {
              const selected = status === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setStatus(option)}
                  style={[
                    styles.statusButton,
                    { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.background },
                  ]}
                >
                  <Text style={{ color: selected ? "#FFFFFF" : colors.text, fontWeight: "700" }}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Drafts are visible only to administrators. Published policies are shown to their selected audience when their effective date is reached.
          </Text>

          <Pressable
            onPress={() => { void handleSave(); }}
            disabled={saving}
            style={[styles.primaryButton, { backgroundColor: colors.accent, opacity: saving ? 0.65 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={styles.primaryButtonText}>{editingId === null ? "Add policy" : "Save changes"}</Text>
            )}
          </Pressable>
          {editingId !== null ? (
            <Pressable onPress={resetForm} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel editing</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Existing policies</Text>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>{policies.length} active</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Loading policies…</Text>
          </View>
        ) : error ? (
          <View style={[styles.messageCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.errorText, { color: "#DC2626" }]}>{error}</Text>
            <Pressable onPress={() => { void loadPolicies(); }}>
              <Text style={{ color: colors.accent, fontWeight: "800" }}>Try again</Text>
            </Pressable>
          </View>
        ) : policies.length === 0 ? (
          <View style={[styles.messageCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No policies yet</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Add the first policy using the form above.</Text>
          </View>
        ) : (
          policies.map((policy) => (
            <View key={policy.policyDocumentId} style={[styles.policyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.policyHeading}>
                <Text style={[styles.policyTitle, { color: colors.text }]}>{policy.title}</Text>
                <View style={[styles.statusTag, { backgroundColor: policy.status === "Published" ? "#DCFCE7" : "#FEF3C7" }]}>
                  <Text style={{ color: policy.status === "Published" ? "#166534" : "#92400E", fontSize: 11, fontWeight: "800" }}>{policy.status}</Text>
                </View>
              </View>
              <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>{policy.description}</Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {policy.audience} · Version {policy.version} · {policy.originalFileName}
                {policy.effectiveDate ? ` · Effective ${policy.effectiveDate.slice(0, 10)}` : ""}
              </Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => beginEdit(policy)} style={[styles.actionButton, { borderColor: colors.border }]}>
                  <Text style={[styles.actionText, { color: colors.accent }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => confirmArchive(policy)} style={[styles.actionButton, { borderColor: "#FECACA" }]}>
                  <Text style={[styles.actionText, { color: "#DC2626" }]}>Archive</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 24, paddingBottom: 20, paddingHorizontal: 18, flexDirection: "row", alignItems: "center" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF1E6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  backText: { fontSize: 32, lineHeight: 36, marginTop: -4 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  refreshText: { fontSize: 26, paddingHorizontal: 8 },
  content: { width: "100%", maxWidth: 1000, alignSelf: "center", padding: 18, paddingBottom: 48 },
  formCard: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  fieldLabel: { fontSize: 13, fontWeight: "700", marginTop: 16, marginBottom: 7 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  descriptionInput: { minHeight: 88 },
  fileButton: { borderWidth: 1, borderRadius: 10, padding: 13, alignItems: "center" },
  fileButtonText: { fontSize: 13, fontWeight: "800" },
  helperText: { fontSize: 11, lineHeight: 16, marginTop: 6 },
  statusRow: { flexDirection: "row", gap: 10 },
  statusButton: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 11, alignItems: "center" },
  primaryButton: { marginTop: 20, borderRadius: 10, padding: 14, alignItems: "center", minHeight: 48, justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  cancelButton: { alignItems: "center", padding: 12 },
  cancelButtonText: { fontSize: 13, fontWeight: "700" },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  countText: { fontSize: 12 },
  center: { alignItems: "center", padding: 30, gap: 10 },
  messageCard: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: "center" },
  errorText: { fontSize: 13, textAlign: "center", marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  policyCard: { borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 10 },
  policyHeading: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  policyTitle: { flex: 1, fontSize: 14, fontWeight: "800" },
  statusTag: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  policyDescription: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: "800" },
});