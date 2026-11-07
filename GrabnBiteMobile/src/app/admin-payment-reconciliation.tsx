import { useCallback, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";
import { apiRequest } from "../services/api";

const NAVY = "#071B2C";
const ORANGE = "#F97316";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SURFACE = "#FFFFFF";

type ReconciliationItem = {
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
};

type PaymentEvent = {
  paymentReconciliationEventId: number;
  actorUserId: number | null;
  actorRole: string;
  eventType: string;
  refundStatus: string | null;
  providerReference: string | null;
  details: string;
  createdAt: string;
};

const refundStatuses = ["REQUIRED", "PENDING", "SUCCEEDED", "FAILED", "MANUAL_REVIEW"];

export default function AdminPaymentReconciliationScreen() {
  const { user, token } = useAuth();
  const { showError } = useErrorFeedback();
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [selected, setSelected] = useState<ReconciliationItem | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [refundStatus, setRefundStatus] = useState("PENDING");
  const [provider, setProvider] = useState("Yoco");
  const [providerReference, setProviderReference] = useState("");
  const [details, setDetails] = useState("");

  const loadQueue = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const result = await apiRequest("/api/payment-reconciliation/open", {}, token);
      setItems(Array.isArray(result) ? result : []);
      setSelected((current) => current
        ? (result as ReconciliationItem[]).find((item) => item.paymentId === current.paymentId) ?? null
        : null);
    } catch (requestError) {
      logAppError("Loading admin payment reconciliation queue", requestError);
      showError(getUserFacingError(requestError, {
        title: "We couldn't load payment reconciliation",
        message: "The payment review queue is temporarily unavailable. Use Refresh to load it again.",
      }));
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  const loadEvents = useCallback(async (paymentId: number) => {
    if (!token) return;
    try {
      setEventsLoading(true);
      const result = await apiRequest("/api/payment-reconciliation/" + paymentId + "/events", {}, token);
      setEvents(Array.isArray(result) ? result : []);
    } catch (requestError) {
      logAppError("Loading payment reconciliation event history", requestError);
      showError(getUserFacingError(requestError, {
        title: "We couldn't load the payment history",
        message: "The audit history could not be loaded. Use Refresh history to load it again.",
      }));
    } finally {
      setEventsLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "Admin") {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start queue loading after authorization is checked.
    void loadQueue();
  }, [user, loadQueue]);

  const canResolveDelayedCheckout = Boolean(
    selected?.requiresReconciliation &&
    selected.refundStatus === "NOT_REQUIRED" &&
    selected.paymentStatus === "PAID",
  );

  const allowedNextStatuses = useMemo(() => {
    const transitions: Record<string, string[]> = {
      NOT_REQUIRED: ["REQUIRED", "MANUAL_REVIEW"],
      REQUIRED: ["PENDING", "FAILED", "MANUAL_REVIEW"],
      PENDING: ["SUCCEEDED", "FAILED", "MANUAL_REVIEW"],
      FAILED: ["REQUIRED", "PENDING", "MANUAL_REVIEW"],
      MANUAL_REVIEW: ["REQUIRED", "PENDING", "SUCCEEDED", "FAILED"],
      SUCCEEDED: [],
    };
    return selected ? transitions[selected.refundStatus] ?? [] : [];
  }, [selected]);

  function selectPayment(item: ReconciliationItem) {
    setSelected(item);
    setEvents([]);
    setRefundStatus(allowedDefaultStatus(item.refundStatus));
    setProvider("Yoco");
    setProviderReference(item.refundProviderReference ?? "");
    setDetails("");
    void loadEvents(item.paymentId);
  }

  async function recordRefundStatus() {
    if (!selected || !token || working) return;
    if (!details.trim()) {
      showError({
        title: "Add reconciliation notes",
        message: "Enter a note describing the provider result or the manual action taken.",
      });
      return;
    }
    if (refundStatus === "SUCCEEDED" && !providerReference.trim()) {
      showError({
        title: "Refund reference required",
        message: "Enter the Yoco refund reference or documented manual refund reference before recording success.",
      });
      return;
    }

    try {
      setWorking(true);
      await apiRequest("/api/payment-reconciliation/" + selected.paymentId + "/refund-status", {
        method: "PATCH",
        body: JSON.stringify({
          status: refundStatus,
          refundAmount: selected.amount,
          provider: provider.trim() || null,
          providerReference: providerReference.trim() || null,
          details: details.trim(),
        }),
      }, token);
      setDetails("");
      await Promise.all([loadQueue(), loadEvents(selected.paymentId)]);
    } catch (requestError) {
      logAppError("Recording payment refund reconciliation status", requestError);
      showError(getUserFacingError(requestError, {
        title: "We couldn't update the refund record",
        message: "The result may have been recorded. Refresh the queue and audit history before making another change.",
        actionLabel: "Refresh payment",
      }), () => {
        void loadQueue();
        void loadEvents(selected.paymentId);
      });
    } finally {
      setWorking(false);
    }
  }

  async function resolveDelayedCheckout() {
    if (!selected || !token || working) return;
    if (!providerReference.trim() || !details.trim()) {
      showError({
        title: "Reconciliation evidence required",
        message: "Enter the Yoco dashboard reference and explain how you verified the delayed checkout and other attempts.",
      });
      return;
    }

    try {
      setWorking(true);
      await apiRequest("/api/payment-reconciliation/" + selected.paymentId + "/resolve", {
        method: "PATCH",
        body: JSON.stringify({
          providerReference: providerReference.trim(),
          details: details.trim(),
        }),
      }, token);
      setDetails("");
      await Promise.all([loadQueue(), loadEvents(selected.paymentId)]);
    } catch (requestError) {
      logAppError("Resolving delayed Yoco checkout reconciliation", requestError);
      showError(getUserFacingError(requestError, {
        title: "We couldn't resolve this reconciliation",
        message: "The resolution may have been recorded. Refresh the queue and audit history before attempting any further action.",
        actionLabel: "Refresh payment",
      }), () => {
        void loadQueue();
        void loadEvents(selected.paymentId);
      });
    } finally {
      setWorking(false);
    }
  }

  if (!user || user.role !== "Admin") return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Admin dashboard</Text>
        </Pressable>
        <Text style={styles.title}>Payment reconciliation</Text>
        <Text style={styles.subtitle}>
          Review unresolved Yoco payments and record verified refund outcomes. This screen does not issue refunds.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarText}>
            <Text style={styles.sectionTitle}>Open review queue</Text>
            <Text style={styles.muted}>{items.length} payment{items.length === 1 ? "" : "s"} requiring attention</Text>
          </View>
          <Pressable style={styles.outlineButton} onPress={() => void loadQueue()} disabled={loading}>
            <Text style={styles.outlineButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="large" color={ORANGE} style={styles.loader} /> : null}
        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>No open reconciliation items</Text>
            <Text style={styles.muted}>Payments requiring refund or manual review will appear here.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <Pressable
            key={item.paymentId}
            onPress={() => selectPayment(item)}
            style={[styles.paymentCard, selected?.paymentId === item.paymentId && styles.selectedCard]}
          >
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>Payment #{item.paymentId}</Text>
              <Text style={styles.status}>{item.refundStatus}</Text>
            </View>
            <Text style={styles.body}>Order #{item.orderId} · {formatMoney(item.amount)}</Text>
            <Text style={styles.muted}>Payment: {item.paymentStatus} · Order: {item.orderStatus}</Text>
            {item.reconciliationReason ? <Text style={styles.reason}>{item.reconciliationReason}</Text> : null}
          </Pressable>
        ))}

        {selected ? (
          <View style={styles.detailPanel}>
            <Text style={styles.sectionTitle}>Payment #{selected.paymentId} details</Text>
            <Detail label="Order" value={"#" + selected.orderId + " · " + selected.orderStatus} />
            <Detail label="Payment method" value={selected.paymentMethod} />
            <Detail label="Payment status" value={selected.paymentStatus} />
            <Detail label="Original amount" value={formatMoney(selected.amount)} />
            <Detail label="Refund status" value={selected.refundStatus} />
            <Detail label="Recorded refund amount" value={selected.refundAmount == null ? "Not recorded" : formatMoney(selected.refundAmount)} />
            <Detail label="Refund provider" value={selected.refundProvider} />
            <Detail label="Refund reference" value={selected.refundProviderReference} />
            <Detail label="Reconciliation opened" value={selected.reconciliationOpenedAt} />
            <Detail label="Refund requested" value={selected.refundRequestedAt} />
            <Detail label="Refund completed" value={selected.refundCompletedAt} />
            <Detail label="Refund failed" value={selected.refundFailedAt} />
            <Detail label="Reconciliation note" value={selected.reconciliationReason} />

            <Text style={styles.sectionTitle}>Record a verified refund outcome</Text>
            <Text style={styles.notice}>
              Recording a status only updates GrabnBite's audit record. It does not send money or call Yoco. Confirm the actual outcome in the provider dashboard first.
            </Text>
            {allowedNextStatuses.length === 0 ? (
              <Text style={styles.muted}>No refund status transitions are available from {selected.refundStatus}.</Text>
            ) : (
              <>
                <Text style={styles.fieldLabel}>New refund status</Text>
                <View style={styles.statusOptions}>
                  {allowedNextStatuses.map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => setRefundStatus(status)}
                      style={[styles.statusOption, refundStatus === status && styles.statusOptionSelected]}
                    >
                      <Text style={[styles.statusOptionText, refundStatus === status && styles.statusOptionTextSelected]}>{status.replace("_", " ")}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Provider</Text>
                <TextInput value={provider} onChangeText={setProvider} placeholder="Yoco or manual provider" placeholderTextColor="#94A3B8" style={styles.input} />
                <Text style={styles.fieldLabel}>Provider / manual reference</Text>
                <TextInput value={providerReference} onChangeText={setProviderReference} placeholder="Refund reference from provider" placeholderTextColor="#94A3B8" style={styles.input} autoCapitalize="none" />
                <Text style={styles.fieldLabel}>Audit notes (required)</Text>
                <TextInput value={details} onChangeText={setDetails} placeholder="What was checked or completed?" placeholderTextColor="#94A3B8" style={[styles.input, styles.multiline]} multiline />
                <Pressable style={[styles.primaryButton, working && styles.disabled]} onPress={() => void recordRefundStatus()} disabled={working}>
                  {working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save refund status</Text>}
                </Pressable>
              </>
            )}

            {canResolveDelayedCheckout ? (
              <>
                <Text style={styles.sectionTitle}>Resolve delayed checkout</Text>
                <Text style={styles.notice}>
                  Use only after confirming the successful payment in Yoco and verifying that every other recorded checkout attempt is failed or cancelled. The server checks the recorded checkout IDs again.
                </Text>
                <Text style={styles.fieldLabel}>Yoco dashboard evidence reference</Text>
                <TextInput value={providerReference} onChangeText={setProviderReference} placeholder="Yoco transaction / evidence reference" placeholderTextColor="#94A3B8" style={styles.input} autoCapitalize="none" />
                <Text style={styles.fieldLabel}>Resolution notes (required)</Text>
                <TextInput value={details} onChangeText={setDetails} placeholder="Describe the provider checks performed..." placeholderTextColor="#94A3B8" style={[styles.input, styles.multiline]} multiline />
                <Pressable style={[styles.primaryButton, working && styles.disabled]} onPress={() => void resolveDelayedCheckout()} disabled={working}>
                  {working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Resolve verified checkout</Text>}
                </Pressable>
              </>
            ) : null}

            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Payment event history</Text>
              <Pressable onPress={() => void loadEvents(selected.paymentId)} disabled={eventsLoading}>
                <Text style={styles.link}>Refresh history</Text>
              </Pressable>
            </View>
            {eventsLoading ? <ActivityIndicator color={ORANGE} /> : null}
            {!eventsLoading && events.length === 0 ? <Text style={styles.muted}>No reconciliation events recorded.</Text> : null}
            {events.map((event) => (
              <View key={event.paymentReconciliationEventId} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{humanize(event.eventType)}</Text>
                <Text style={styles.muted}>{formatDate(event.createdAt)} · {event.actorRole || "System"}</Text>
                {event.refundStatus ? <Text style={styles.body}>Refund status: {event.refundStatus}</Text> : null}
                {event.providerReference ? <Text style={styles.body}>Reference: {event.providerReference}</Text> : null}
                <Text style={styles.body}>{event.details}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function allowedDefaultStatus(currentStatus: string) {
  if (currentStatus === "NOT_REQUIRED") return "REQUIRED";
  if (currentStatus === "FAILED") return "REQUIRED";
  if (currentStatus === "MANUAL_REVIEW") return "REQUIRED";
  if (currentStatus === "PENDING") return "MANUAL_REVIEW";
  return "PENDING";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value == null || value === "" ? "Not recorded" : String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 22 },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 7 },
  content: { width: "100%", maxWidth: 960, alignSelf: "center", padding: 18, paddingBottom: 50 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  toolbarText: { flex: 1 },
  sectionTitle: { color: NAVY, fontSize: 17, fontWeight: "800", marginTop: 20, marginBottom: 9 },
  muted: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 },
  loader: { marginVertical: 24 },
  outlineButton: { borderWidth: 1, borderColor: ORANGE, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  outlineButtonText: { color: "#C2410C", fontWeight: "800", fontSize: 12 },
  emptyCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 18, marginBottom: 14 },
  paymentCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 15, marginBottom: 10 },
  selectedCard: { borderColor: ORANGE, borderWidth: 2 },
  cardHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { color: NAVY, fontSize: 15, fontWeight: "800" },
  status: { color: "#C2410C", fontSize: 11, fontWeight: "800" },
  body: { color: "#475569", fontSize: 13, lineHeight: 19, marginTop: 5 },
  reason: { color: "#92400E", backgroundColor: "#FFFBEB", padding: 9, borderRadius: 7, fontSize: 12, lineHeight: 18, marginTop: 9 },
  detailPanel: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginTop: 12 },
  detailRow: { borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 8 },
  detailLabel: { color: MUTED, fontSize: 11, fontWeight: "700" },
  detailValue: { color: NAVY, fontSize: 13, marginTop: 3 },
  notice: { color: "#92400E", backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", padding: 11, borderRadius: 8, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  fieldLabel: { color: NAVY, fontSize: 12, fontWeight: "800", marginTop: 12, marginBottom: 6 },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusOption: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: SURFACE },
  statusOptionSelected: { borderColor: ORANGE, backgroundColor: "#FFF7ED" },
  statusOptionText: { color: MUTED, fontSize: 11, fontWeight: "700" },
  statusOptionTextSelected: { color: "#C2410C" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 11, color: NAVY, backgroundColor: SURFACE, fontSize: 13 },
  multiline: { minHeight: 84, textAlignVertical: "top" },
  primaryButton: { backgroundColor: ORANGE, borderRadius: 9, padding: 13, alignItems: "center", marginTop: 12 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  link: { color: "#C2410C", fontSize: 12, fontWeight: "800" },
  eventCard: { borderLeftWidth: 3, borderLeftColor: ORANGE, backgroundColor: "#F8FAFC", padding: 11, borderRadius: 7, marginBottom: 9 },
  eventTitle: { color: NAVY, fontSize: 13, fontWeight: "800" },
});
