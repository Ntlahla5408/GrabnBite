import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";

interface ReconciliationItem {
  paymentId: number;
  orderId: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  amount: number;
  refundStatus: string;
  refundAmount: number | null;
  refundRequiredAt: string | null;
  refundProvider: string | null;
  refundProviderReference: string | null;
  refundRequestedAt: string | null;
  refundCompletedAt: string | null;
  refundFailedAt: string | null;
  requiresReconciliation: boolean;
  reconciliationReason: string | null;
  reconciliationOpenedAt: string | null;
  reconciliationResolvedAt: string | null;
  reconciliationResolutionNotes: string | null;
}

interface ReconciliationEvent {
  paymentReconciliationEventId: number;
  actorUserId: number | null;
  actorRole: string;
  eventType: string;
  refundStatus: string;
  providerReference: string | null;
  details: string;
  createdAt: string;
}

const allowedRefundTransitions: Record<string, string[]> = {
  NOT_REQUIRED: ["REQUIRED", "MANUAL_REVIEW"],
  REQUIRED: ["PENDING", "FAILED", "MANUAL_REVIEW"],
  PENDING: ["SUCCEEDED", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["REQUIRED", "PENDING", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["REQUIRED", "PENDING", "SUCCEEDED", "FAILED"],
  SUCCEEDED: [],
};

export default function AdminPaymentReconciliationScreen() {
  const { user, token } = useAuth();
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];

  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [nextStatus, setNextStatus] = useState("PENDING");
  const [provider, setProvider] = useState("YOCO");
  const [providerReference, setProviderReference] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<ReconciliationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadItems = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await apiRequest("/api/payment-reconciliation/open", {}, token);
      setItems(Array.isArray(result) ? result : []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reconciliation items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start the protected queue request.
    void loadItems();
  }, [user, loadItems]);

  const selectedItem = items.find(item => item.paymentId === selectedPaymentId) ?? null;

  const loadEvents = useCallback(async (paymentId: number) => {
    setEventsLoading(true);
    try {
      const result = await apiRequest(`/api/payment-reconciliation/${paymentId}/events`, {}, token);
      setEvents(Array.isArray(result) ? result : []);
    } catch (eventError) {
      Alert.alert("Audit history unavailable", eventError instanceof Error ? eventError.message : "Unable to load payment history.");
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  function openItem(item: ReconciliationItem) {
    setSelectedPaymentId(item.paymentId);
    const allowedNextStatuses = allowedRefundTransitions[item.refundStatus] ?? [];
    setNextStatus(allowedNextStatuses[0] ?? item.refundStatus);
    setProvider(item.refundProvider || "YOCO");
    setProviderReference("");
    setDetails("");
    setEvents([]);
    void loadEvents(item.paymentId);
  }

  async function saveRefundStatus() {
    if (!selectedItem || saving) return;
    if (!details.trim()) {
      Alert.alert("Details required", "Add a short explanation for the audit trail.");
      return;
    }
    if (nextStatus === "SUCCEEDED" && !providerReference.trim()) {
      Alert.alert("Evidence reference required", "Enter the actual refund reference from the provider dashboard before recording completion.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(
        `/api/payment-reconciliation/${selectedItem.paymentId}/refund-status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            provider: provider.trim() || null,
            providerReference: providerReference.trim() || null,
            details: details.trim(),
            refundAmount: selectedItem.amount,
          }),
        },
        token,
      );
      Alert.alert("Refund record updated", "This records the administrator-reported outcome. It does not issue a refund through the provider.");
      setSelectedPaymentId(null);
      await loadItems(true);
    } catch (saveError) {
      Alert.alert("Unable to update refund", saveError instanceof Error ? saveError.message : "The refund record could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function resolveCheckoutReview() {
    if (!selectedItem || saving) return;
    if (!providerReference.trim() || !details.trim()) {
      Alert.alert("Evidence required", "Enter the provider reference and explain the verification performed.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(
        `/api/payment-reconciliation/${selectedItem.paymentId}/resolve`,
        {
          method: "PATCH",
          body: JSON.stringify({
            providerReference: providerReference.trim(),
            details: details.trim(),
          }),
        },
        token,
      );
      Alert.alert("Reconciliation resolved", "The backend verified recorded checkout attempts. No refund was issued.");
      setSelectedPaymentId(null);
      await loadItems(true);
    } catch (resolveError) {
      Alert.alert("Unable to resolve review", resolveError instanceof Error ? resolveError.message : "The reconciliation remains open.");
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "Admin") return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={[styles.back, { color: colors.accent }]}>‹ Back</Text></Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Payment reconciliation</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review outstanding refunds and payment exceptions.</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={colors.accent} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading ? (
          <Pressable style={[styles.refreshButton, { borderColor: colors.border }]} onPress={() => void loadItems(true)} disabled={refreshing}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{refreshing ? "Refreshing…" : "Refresh queue"}</Text>
          </Pressable>
        ) : null}

        {!loading && items.length === 0 && !error ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>No open payment cases</Text>
            <Text style={{ color: colors.textSecondary }}>There are currently no refunds or payment exceptions awaiting review.</Text>
          </View>
        ) : null}

        {items.map(item => (
          <Pressable key={item.paymentId} onPress={() => openItem(item)} style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: selectedPaymentId === item.paymentId ? colors.accent : colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment #{item.paymentId}</Text>
              <Text style={styles.status}>{item.refundStatus}</Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>Order #{item.orderId} · {item.orderStatus}</Text>
            <Text style={{ color: colors.text, marginTop: 5 }}>Payment: {item.paymentStatus} · {item.paymentMethod}</Text>
            <Text style={{ color: colors.text, marginTop: 5 }}>Amount: R{Number(item.amount).toFixed(2)} · Refund: {item.refundAmount == null ? "Not set" : `R${Number(item.refundAmount).toFixed(2)}`}</Text>
            {item.requiresReconciliation ? <Text style={styles.warning}>Payment reconciliation required</Text> : null}
            {item.reconciliationReason ? <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{item.reconciliationReason}</Text> : null}
          </Pressable>
        ))}

        {selectedItem ? (
          <View style={[styles.editor, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Review payment #{selectedItem.paymentId}</Text>
            <Text style={[styles.helper, { color: colors.textSecondary }]}>
              Only record SUCCEEDED after checking the actual provider refund record. This app does not issue the refund.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Refund status to record</Text>
            <View style={styles.statusChoices}>
              {(allowedRefundTransitions[selectedItem.refundStatus] ?? []).map(status => (
                <Pressable key={status} onPress={() => setNextStatus(status)} style={[styles.choice, nextStatus === status && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, nextStatus === status && styles.choiceTextSelected]}>{status.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Provider</Text>
            <TextInput value={provider} onChangeText={setProvider} placeholder="YOCO" style={styles.input} />

            <Text style={[styles.label, { color: colors.text }]}>Provider refund reference</Text>
            <TextInput value={providerReference} onChangeText={setProviderReference} placeholder="Reference from provider dashboard" style={styles.input} autoCapitalize="none" />

            <Text style={[styles.label, { color: colors.text }]}>Audit details</Text>
            <TextInput value={details} onChangeText={setDetails} placeholder="What was checked or what action was taken?" style={[styles.input, styles.multiline]} multiline />

            {(allowedRefundTransitions[selectedItem.refundStatus] ?? []).length > 0 ? (
              <Pressable onPress={() => void saveRefundStatus()} disabled={saving} style={[styles.primaryButton, saving && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{saving ? "Saving…" : "Record refund status"}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.helper, { color: colors.textSecondary }]}>This refund is already marked completed and has no further allowed status transitions.</Text>
            )}

            {selectedItem.refundStatus === "NOT_REQUIRED" && selectedItem.requiresReconciliation ? (
              <Pressable onPress={() => void resolveCheckoutReview()} disabled={saving} style={[styles.secondaryButton, saving && styles.disabled]}>
                <Text style={styles.secondaryButtonText}>Verify and resolve checkout review</Text>
              </Pressable>
            ) : null}

            <Text style={[styles.cardTitle, { color: colors.text, marginTop: 22 }]}>Audit history</Text>
            {eventsLoading ? <ActivityIndicator color={colors.accent} /> : events.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No audit events recorded.</Text>
            ) : events.map(event => (
              <View key={event.paymentReconciliationEventId} style={styles.event}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.eventType} · {event.refundStatus}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(event.createdAt).toLocaleString()} · {event.actorRole}</Text>
                {event.providerReference ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Reference: {event.providerReference}</Text> : null}
                <Text style={{ color: colors.text, marginTop: 4 }}>{event.details}</Text>
              </View>
            ))}

            <Pressable onPress={() => setSelectedPaymentId(null)} style={styles.closeButton}>
              <Text style={{ color: colors.accent, fontWeight: "700" }}>Close review</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: "100%", maxWidth: 1000, alignSelf: "center", padding: 20, paddingBottom: 48 },
  header: { marginBottom: 18 },
  back: { fontWeight: "700", marginBottom: 12, fontSize: 15 },
  title: { fontSize: 25, fontWeight: "800" },
  subtitle: { marginTop: 6, lineHeight: 20 },
  refreshButton: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  status: { color: "#9A4D00", fontWeight: "800", fontSize: 12 },
  warning: { color: "#9A4D00", fontWeight: "800", marginTop: 8 },
  editor: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 10 },
  helper: { lineHeight: 19, marginBottom: 14 },
  label: { fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#FFFFFF", color: "#172B3A" },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  statusChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8 },
  choiceSelected: { backgroundColor: "#F28C28", borderColor: "#F28C28" },
  choiceText: { color: "#334155", fontSize: 11, fontWeight: "700" },
  choiceTextSelected: { color: "#FFFFFF" },
  primaryButton: { backgroundColor: "#F28C28", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { borderWidth: 1, borderColor: "#F28C28", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 10 },
  secondaryButtonText: { color: "#A64B00", fontWeight: "800" },
  disabled: { opacity: 0.55 },
  event: { borderLeftWidth: 3, borderLeftColor: "#F28C28", paddingLeft: 10, marginTop: 12, paddingVertical: 5 },
  eventTitle: { fontWeight: "800" },
  closeButton: { alignItems: "center", padding: 12, marginTop: 10 },
  error: { color: "#B42318", marginVertical: 10 },
});
