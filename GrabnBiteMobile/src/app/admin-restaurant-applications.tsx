import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";

interface ApplicationSummary {
  restaurantApplicationId: number;
  applicationReference: string;
  status: string;
  tradingName: string | null;
  registeredBusinessName: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantEmailVerified: boolean;
  submittedAt: string | null;
  updatedAt: string;
}

interface ApplicationDetail {
  restaurantApplicationId: number;
  applicationReference: string;
  status: string;
  applicant: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isEmailVerified: boolean;
  };
  tradingName: string | null;
  registeredBusinessName: string | null;
  cipcRegistrationNumber: string | null;
  restaurantCategory: string | null;
  physicalAddress: string | null;
  city: string | null;
  restaurantContactNumber: string | null;
  businessEmail: string | null;
  representativeFullName: string | null;
  representativePosition: string | null;
  representativeMobileNumber: string | null;
  representativeEmail: string | null;
  hasAuthorityToRepresent: boolean | null;
  offersCustomerCollection: boolean | null;
  offersRestaurantDelivery: boolean | null;
  offersGrubnBiteDelivery: boolean | null;
  averagePreparationTimeMinutes: number | null;
  maximumDeliveryDistanceKm: number | null;
  commissionOfferAccepted: boolean | null;
  submittedAt: string | null;
  documentsRequestedMessage: string | null;
  rejectionReason: string | null;
  documents: {
    restaurantDocumentId: number;
    documentType: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    verificationStatus: string;
    adminComment: string | null;
    uploadedAt: string;
    signedUrl: string;
  }[];
  bankingDetails: null | {
    accountHolderName: string;
    bankName: string;
    accountType: string;
    maskedAccountNumber: string;
    branchCode: string;
    payoutContactEmail: string;
    verificationStatus: string;
  };
  operatingHours: {
    dayOfWeek: string;
    isOpen: boolean;
    openingTime: string | null;
    closingTime: string | null;
  }[];
}

export default function AdminRestaurantApplicationsScreen() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [selected, setSelected] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadApplications = useCallback(async () => {
    if (!token) return;
    try {
      const result = await apiRequest("/api/AdminRestaurantApplication", {}, token);
      setApplications(result);
      setError("");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load restaurant applications.");
    } finally {
      setLoading(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    void loadApplications();
  }, [user, loadApplications]);

  async function openApplication(applicationId: number) {
    if (!token) return;
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");
      const result = await apiRequest(
        `/api/AdminRestaurantApplication/${applicationId}`,
        {},
        token,
      );
      setSelected(result);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load the application.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function performAction(path: string, body?: object, method: "PUT" | "POST" = "PUT") {
    if (!token || !selected) return;
    try {
      setWorking(true);
      setError("");
      setMessage("");
      const result = await apiRequest(
        `/api/AdminRestaurantApplication/${selected.restaurantApplicationId}${path}`,
        {
          method,
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
        token,
      );
      const successMessage = result?.message || "Application updated successfully.";
      await openApplication(selected.restaurantApplicationId);
      await loadApplications();
      setMessage(successMessage);
    } catch (requestError: any) {
      setError(requestError?.message || "The requested action could not be completed.");
    } finally {
      setWorking(false);
    }
  }

  if (!user || user.role !== "Admin") return null;

  const latestDocumentIdByType = new Map<string, number>();
  for (const document of selected?.documents ?? []) {
    const currentLatestId = latestDocumentIdByType.get(document.documentType);
    const currentLatest = selected?.documents.find(
      (item) => item.restaurantDocumentId === currentLatestId,
    );
    if (
      !currentLatest ||
      new Date(document.uploadedAt).getTime() > new Date(currentLatest.uploadedAt).getTime() ||
      (document.uploadedAt === currentLatest.uploadedAt &&
        document.restaurantDocumentId > currentLatest.restaurantDocumentId)
    ) {
      latestDocumentIdByType.set(document.documentType, document.restaurantDocumentId);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => selected ? setSelected(null) : router.replace("/admin-dashboard")}>
          <Text style={styles.back}>‹ {selected ? "Applications" : "Dashboard"}</Text>
        </Pressable>
        <Text style={styles.title}>Restaurant partner applications</Text>
        <Text style={styles.subtitle}>
          Review applicant information, supporting documents and payout verification before approval.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {selected ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.applicationTitle}>{selected.tradingName || selected.registeredBusinessName || selected.applicationReference}</Text>
          <Text style={styles.meta}>Reference: {selected.applicationReference} · Status: {selected.status}</Text>
          <Text style={styles.section}>Applicant</Text>
          <Text style={styles.body}>{selected.applicant.firstName} {selected.applicant.lastName}</Text>
          <Text style={styles.body}>{selected.applicant.email} · {selected.applicant.phoneNumber}</Text>
          <Text style={styles.meta}>Email verified: {selected.applicant.isEmailVerified ? "Yes" : "No"}</Text>

          <Text style={styles.section}>Business details</Text>
          <Detail label="Trading name" value={selected.tradingName} />
          <Detail label="Registered name" value={selected.registeredBusinessName} />
          <Detail label="CIPC number" value={selected.cipcRegistrationNumber} />
          <Detail label="Category" value={selected.restaurantCategory} />
          <Detail label="Address" value={[selected.physicalAddress, selected.city].filter(Boolean).join(", ")} />
          <Detail label="Business contact" value={selected.restaurantContactNumber} />
          <Detail label="Business email" value={selected.businessEmail} />
          <Detail label="Representative" value={selected.representativeFullName} />
          <Detail label="Position" value={selected.representativePosition} />
          <Detail label="Representative contact" value={selected.representativeMobileNumber} />
          <Detail label="Representative email" value={selected.representativeEmail} />
          <Detail label="Authority confirmed" value={selected.hasAuthorityToRepresent ? "Yes" : "No"} />
          <Detail label="Fulfilment" value={[
            selected.offersCustomerCollection ? "Collection" : null,
            selected.offersRestaurantDelivery ? "Restaurant delivery" : null,
            selected.offersGrubnBiteDelivery ? "GrubnBite delivery" : null,
          ].filter(Boolean).join(", ")} />
          <Detail label="Preparation time" value={selected.averagePreparationTimeMinutes ? `${selected.averagePreparationTimeMinutes} minutes` : null} />
          <Detail label="Commission accepted" value={selected.commissionOfferAccepted ? "Yes" : "No"} />

          <Text style={styles.section}>Operating hours</Text>
          {selected.operatingHours.map((hour) => (
            <Text key={hour.dayOfWeek} style={styles.body}>
              {hour.dayOfWeek}: {hour.isOpen ? `${hour.openingTime}–${hour.closingTime}` : "Closed"}
            </Text>
          ))}

          <Text style={styles.section}>Supporting documents</Text>
          {selected.documents.length === 0 ? <Text style={styles.meta}>No documents uploaded.</Text> : null}
          {selected.documents.map((document) => {
            const isLatestCopy =
              latestDocumentIdByType.get(document.documentType) === document.restaurantDocumentId;

            return (
              <View key={document.restaurantDocumentId} style={styles.documentCard}>
                <Text style={styles.body}>{document.documentType} · {document.originalFileName}</Text>
                <Text style={styles.meta}>
                  {document.verificationStatus} · {(document.fileSize / 1024).toFixed(0)} KB ·
                  {" "}{new Date(document.uploadedAt).toLocaleString()}
                </Text>
                <Text style={isLatestCopy ? styles.latestDocument : styles.supersededDocument}>
                  {isLatestCopy
                    ? "Latest submitted copy — this copy must be approved"
                    : "Superseded copy — approval of this copy does not satisfy the requirement"}
                </Text>
                {document.adminComment ? <Text style={styles.meta}>Review note: {document.adminComment}</Text> : null}
                <View style={styles.actionRow}>
                  <Action label="View file" onPress={() => Linking.openURL(document.signedUrl)} disabled={working} secondary />
                  <Action label="Approve document" onPress={() => performAction(`/documents/${document.restaurantDocumentId}/review`, { status: "Approved", comment })} disabled={working || !isLatestCopy || document.verificationStatus === "Approved"} />
                  <Action label="Reject document" onPress={() => performAction(`/documents/${document.restaurantDocumentId}/review`, { status: "Rejected", comment })} disabled={working || !isLatestCopy || !comment.trim() || document.verificationStatus === "Rejected"} danger />
                </View>
              </View>
            );
          })}

          <Text style={styles.section}>Payout banking details</Text>
          {selected.bankingDetails ? (
            <>
              <Detail label="Account holder" value={selected.bankingDetails.accountHolderName} />
              <Detail label="Bank" value={selected.bankingDetails.bankName} />
              <Detail label="Account type" value={selected.bankingDetails.accountType} />
              <Detail label="Account number" value={selected.bankingDetails.maskedAccountNumber} />
              <Detail label="Branch code" value={selected.bankingDetails.branchCode} />
              <Detail label="Payout email" value={selected.bankingDetails.payoutContactEmail} />
              <Text style={styles.meta}>Verification: {selected.bankingDetails.verificationStatus}</Text>
              <View style={styles.actionRow}>
                <Action label="Verify banking" onPress={() => performAction("/banking/review", { isApproved: true })} disabled={working || selected.bankingDetails?.verificationStatus === "Approved"} />
                <Action label="Reject banking" onPress={() => performAction("/banking/review", { isApproved: false, comment })} disabled={working || !comment.trim()} danger />
              </View>
            </>
          ) : <Text style={styles.meta}>Banking details not supplied.</Text>}

          <Text style={styles.section}>Administrator note / request</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a note or explain what must be corrected"
            placeholderTextColor="#94A3B8"
            multiline
            style={styles.comment}
          />

          <Text style={styles.section}>Review actions</Text>
          <View style={styles.actionColumn}>
            <Action label="Mark under verification" onPress={() => performAction("/under-verification", { comment })} disabled={working || selected.status !== "PendingReview"} />
            <Action label="Request more documents" onPress={() => performAction("/request-documents", { comment })} disabled={working || !comment.trim() || !["PendingReview", "UnderVerification", "DocumentsRequired"].includes(selected.status)} secondary />
            <Action label="Reject application" onPress={() => performAction("/reject", { comment })} disabled={working || !comment.trim() || ["Approved", "Rejected"].includes(selected.status)} danger />
            <Action label="Approve and activate restaurant" onPress={() => performAction("/approve", undefined, "POST")} disabled={working || !["PendingReview", "UnderVerification"].includes(selected.status)} />
          </View>
          {working ? <ActivityIndicator color="#F97316" style={{ marginTop: 16 }} /> : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {loading || detailLoading ? <ActivityIndicator color="#F97316" size="large" /> : null}
          <Pressable style={styles.refresh} onPress={() => { setLoading(true); void loadApplications(); }}>
            <Text style={styles.refreshText}>Refresh applications</Text>
          </Pressable>
          {!loading && applications.length === 0 ? <Text style={styles.meta}>No restaurant partner applications have been submitted yet.</Text> : null}
          {applications.map((application) => (
            <Pressable
              key={application.restaurantApplicationId}
              style={styles.applicationCard}
              onPress={() => void openApplication(application.restaurantApplicationId)}
            >
              <Text style={styles.applicationTitle}>{application.tradingName || application.registeredBusinessName || "New restaurant application"}</Text>
              <Text style={styles.body}>{application.applicantName} · {application.applicantEmail}</Text>
              <Text style={styles.meta}>Ref: {application.applicationReference} · {application.status}</Text>
              <Text style={styles.meta}>Email verified: {application.applicantEmailVerified ? "Yes" : "No"}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.body}>{value || "Not provided"}</Text>
    </View>
  );
}

function Action({
  label,
  onPress,
  disabled,
  secondary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.action,
        secondary && styles.secondaryAction,
        danger && styles.dangerAction,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionText, (secondary || danger) && styles.secondaryActionText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#071B2C", paddingHorizontal: 22, paddingTop: 52, paddingBottom: 22 },
  back: { color: "#FDBA74", fontSize: 14, fontWeight: "700", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 12, lineHeight: 18, marginTop: 7 },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 18, paddingBottom: 50 },
  applicationCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 15, marginTop: 12 },
  applicationTitle: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
  body: { color: "#334155", fontSize: 13, lineHeight: 19, marginTop: 4 },
  meta: { color: "#64748B", fontSize: 12, marginTop: 5, lineHeight: 18 },
  latestDocument: { color: "#166534", fontSize: 12, fontWeight: "800", marginTop: 7 },
  supersededDocument: { color: "#92400E", fontSize: 12, fontWeight: "700", marginTop: 7 },
  section: { color: "#0F172A", fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 8 },
  detailRow: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  detailLabel: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  documentCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 12, marginTop: 9 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionColumn: { gap: 9 },
  action: { backgroundColor: "#F97316", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, alignItems: "center" },
  secondaryAction: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1" },
  dangerAction: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA" },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  secondaryActionText: { color: "#334155" },
  disabled: { opacity: 0.45 },
  comment: { minHeight: 90, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, backgroundColor: "#FFFFFF", color: "#0F172A", padding: 12, textAlignVertical: "top" },
  refresh: { backgroundColor: "#F97316", borderRadius: 9, padding: 12, alignItems: "center", marginBottom: 8 },
  refreshText: { color: "#FFFFFF", fontWeight: "800" },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", padding: 10, marginHorizontal: 16, marginTop: 10, borderRadius: 8 },
  success: { color: "#166534", backgroundColor: "#DCFCE7", padding: 10, marginHorizontal: 16, marginTop: 10, borderRadius: 8 },
});
