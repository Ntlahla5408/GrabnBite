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
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";
import { apiRequest } from "../services/api";

const NAVY = "#071B2C";
const ORANGE = "#F97316";
const MUTED = "#64748B";

type ApplicationSummary = {
  driverApplicationId: number;
  applicationReference: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantEmailVerified: boolean;
  partnerType: string | null;
  applyingAs: string | null;
  vehicleType: string | null;
  vehicleRegistration: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

type ApplicationDetail = Record<string, any> & {
  driverApplicationId: number;
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
  documents: {
    driverApplicationDocumentId: number;
    documentType: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    verificationStatus: string;
    adminComment: string | null;
    signedUrl: string;
  }[];
};

const sections: { title: string; keys: string[] }[] = [
  { title: "Personal information", keys: ["fullLegalName", "surname", "preferredName", "idOrPassportNumber", "dateOfBirth", "nationality", "mobileNumber", "alternativeContactNumber", "emailAddress", "residentialAddress", "suburbOrTownship", "cityOrTown", "province", "postalCode"] },
  { title: "Partner and business details", keys: ["partnerType", "applyingAs", "registeredBusinessName", "companyRegistrationNumber", "businessAddress", "businessRepresentative", "numberOfDrivers"] },
  { title: "Vehicle information", keys: ["vehicleMake", "vehicleModel", "vehicleYear", "vehicleRegistration", "vehicleColour", "vehicleType", "vehicleOwner", "isRoadworthy", "isLicensed", "isInsured", "commercialDeliveryInsurance", "requiresDriversLicence", "requiresProfessionalDrivingPermit", "requiresRoadworthiness", "vehicleOwnedByApplicant"] },
  { title: "Delivery equipment", keys: ["hasInsulatedDeliveryBag", "hasSecureTransportContainer", "hasSmartphone", "hasMobileInternet", "hasPhoneHolder", "hasProtectiveClothing", "hasHelmet", "hasReflectiveEquipment", "otherEquipment", "needsEquipmentAssistance"] },
  { title: "Availability and service area", keys: ["preferredProvince", "preferredCityOrTown", "preferredAreas", "workingDays", "availability", "outsidePreferredArea"] },
  { title: "Banking details", keys: ["accountHolderName", "bankName", "maskedAccountNumber", "accountType", "branchCode", "accountHolderIdOrRegistrationNumber"] },
  { title: "Emergency contact", keys: ["emergencyContactName", "emergencyContactRelationship", "emergencyContactNumber", "emergencyContactAlternativeNumber"] },
  { title: "Experience and background", keys: ["hasDeliveryExperience", "previousCompanyOrPlatform", "experienceDuration", "previousDeliveryTypes", "hasFoodDeliveryExperience", "hasRelevantTraining", "trainingDetails"] },
  { title: "Policy acknowledgements", keys: ["acknowledgedDeliveryPartnerAgreement", "acknowledgedCollectionProcedures", "acknowledgedCodeOfConduct", "acknowledgedFailedDeliveryPolicy", "acknowledgedAccidentAndLiabilityPolicy", "acknowledgedPaymentSchedule", "policyVersionsOrLinks"] },
  { title: "Declarations and consent", keys: ["confirmedInformationAccurate", "confirmedDocumentAuthority", "consentedToVerification", "confirmedLegalCompliance", "acknowledgedNoGuaranteedAcceptance", "acceptedPlatformPolicies", "acknowledgedCompensationSeparation", "acknowledgedWorkingRelationship", "consentedToPersonalInformationProcessing", "acknowledgedPopia"] },
  { title: "Electronic signature", keys: ["signatureFullLegalName", "signatureIdOrPassportNumber", "signatureEmailAddress", "signatureMobileNumber", "signatureMethod", "acceptedAt"] },
];

export default function AdminDriverApplicationsScreen() {
  const { user, token } = useAuth();
  const { showError } = useErrorFeedback();
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
      const result = await apiRequest("/api/AdminDriverApplication", {}, token);
      setApplications(result);
      setError("");
    } catch (requestError) {
      logAppError("Admin driver applications operation", requestError);
      showError(getUserFacingError(requestError, { title: "We couldn't complete this action", message: "Unable to load driver applications.", actionLabel: "Try again" }));
    } finally {
      setLoading(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    void loadApplications();
  }, [user, loadApplications]);

  async function openSignedDocument(url: string) {
    try {
      await Linking.openURL(url);
    } catch (documentError) {
      logAppError("Opening a driver application document", documentError);
      showError(getUserFacingError(documentError, {
        title: "We couldn't open this document",
        message: "The document could not be opened. Please try again or refresh the application.",
      }));
    }
  }

  async function openApplication(applicationId: number) {
    if (!token) return;
    try {
      setDetailLoading(true);
      setError("");
      setMessage("");
      const result = await apiRequest("/api/AdminDriverApplication/" + applicationId, {}, token);
      setSelected(result);
    } catch (requestError) {
      logAppError("Admin driver applications operation", requestError);
      showError(getUserFacingError(requestError, { title: "We couldn't complete this action", message: "Unable to load the driver application.", actionLabel: "Try again" }));
    } finally {
      setDetailLoading(false);
    }
  }

  async function performAction(path: string, body?: object) {
    if (!token || !selected) return;
    try {
      setWorking(true);
      setError("");
      setMessage("");
      const result = await apiRequest(
        "/api/AdminDriverApplication/" + selected.driverApplicationId + path,
        {
          method: "PUT",
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
        token,
      );
      const successMessage = result?.message || "Application updated successfully.";
      await openApplication(selected.driverApplicationId);
      await loadApplications();
      setMessage(successMessage);
    } catch (requestError) {
      logAppError("Admin driver applications operation", requestError);
      showError(getUserFacingError(requestError, { title: "We couldn't complete this action", message: "The requested action could not be completed.", actionLabel: "Try again" }));
    } finally {
      setWorking(false);
    }
  }

  async function reviewDocument(documentId: number, status: "Approved" | "Rejected") {
    if (!token || !selected) return;
    if (status === "Rejected" && !comment.trim()) {
      setError("Enter a comment before rejecting a document.");
      return;
    }
    try {
      setWorking(true);
      setError("");
      await apiRequest(
        "/api/AdminDriverApplication/" + selected.driverApplicationId + "/documents/" + documentId + "/review",
        {
          method: "PUT",
          body: JSON.stringify({ status, comment: comment.trim() || null }),
        },
        token,
      );
      setComment("");
      await openApplication(selected.driverApplicationId);
      await loadApplications();
      setMessage("Document review saved.");
    } catch (requestError) {
      logAppError("Admin driver applications operation", requestError);
      showError(getUserFacingError(requestError, { title: "We couldn't complete this action", message: "Unable to review this document.", actionLabel: "Try again" }));
    } finally {
      setWorking(false);
    }
  }

  if (!user || user.role !== "Admin") return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => selected ? setSelected(null) : router.replace("/admin-dashboard")}>
          <Text style={styles.back}>‹ {selected ? "Applications" : "Dashboard"}</Text>
        </Pressable>
        <Text style={styles.title}>Driver partner applications</Text>
        <Text style={styles.subtitle}>Review applicant information and supporting documents before approving delivery partners.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.notice}>{message}</Text> : null}

      {selected ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.applicationTitle}>{selected.fullLegalName || selected.applicationReference}</Text>
          <Text style={styles.meta}>Reference: {selected.applicationReference} · Status: {selected.status}</Text>

          <Text style={styles.section}>Account details</Text>
          <Detail label="Account holder" value={selected.applicant.firstName + " " + selected.applicant.lastName} />
          <Detail label="Account email" value={selected.applicant.email} />
          <Detail label="Account phone" value={selected.applicant.phoneNumber} />
          <Detail label="Email verified" value={selected.applicant.isEmailVerified ? "Yes" : "No"} />
          <Detail label="Previous administrator comments" value={selected.adminComments} />
          <Detail label="Documents requested" value={selected.documentsRequestedMessage} />
          <Detail label="Rejection reason" value={selected.rejectionReason} />

          {sections.map((section) => (
            <View key={section.title}>
              <Text style={styles.section}>{section.title}</Text>
              {section.keys.map((key) => (
                <Detail
                  key={key}
                  label={humanize(key)}
                  value={key === "policyVersionsOrLinks"
                    ? formatPolicyAcknowledgements(selected[key])
                    : formatValue(key === "maskedAccountNumber" ? selected.maskedAccountNumber : selected[key])}
                />
              ))}
            </View>
          ))}

          <Text style={styles.section}>Supporting documents</Text>
          {selected.documents.map((document) => (
            <View key={document.driverApplicationDocumentId} style={styles.documentCard}>
              <Text style={styles.documentTitle}>{humanize(document.documentType)}</Text>
              <Text style={styles.body}>{document.originalFileName}</Text>
              <Text style={styles.meta}>Status: {document.verificationStatus} · {(document.fileSize / 1024).toFixed(0)} KB</Text>
              {document.adminComment ? <Text style={styles.meta}>Review note: {document.adminComment}</Text> : null}
              <Pressable onPress={() => void openSignedDocument(document.signedUrl)} style={styles.openButton}>
                <Text style={styles.openButtonText}>Open document</Text>
              </Pressable>
              {document.verificationStatus === "Pending" ? (
                <View style={styles.documentActions}>
                  <Pressable style={styles.approveButton} onPress={() => void reviewDocument(document.driverApplicationDocumentId, "Approved")} disabled={working}>
                    <Text style={styles.actionText}>Approve document</Text>
                  </Pressable>
                  <Pressable style={styles.rejectButton} onPress={() => void reviewDocument(document.driverApplicationDocumentId, "Rejected")} disabled={working}>
                    <Text style={styles.actionText}>Reject document</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}

          <Text style={styles.section}>Administrator review</Text>
          <TextInput
            style={[styles.commentInput, styles.multiline]}
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Add a review note, document request or rejection reason..."
            placeholderTextColor="#94A3B8"
          />
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={() => void performAction("/under-verification", { comment: comment.trim() || null })} disabled={working}>
              <Text style={styles.secondaryText}>Mark under verification</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void performAction("/request-documents", { comment })} disabled={working}>
              <Text style={styles.secondaryText}>Request documents</Text>
            </Pressable>
            <Pressable style={styles.rejectButton} onPress={() => void performAction("/reject", { comment })} disabled={working}>
              <Text style={styles.actionText}>Reject application</Text>
            </Pressable>
            <Pressable style={styles.approveButton} onPress={() => void performAction("/approve")} disabled={working}>
              {working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>Approve driver</Text>}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {loading || detailLoading ? <ActivityIndicator size="large" color={ORANGE} /> : null}
          {!loading && applications.length === 0 ? <Text style={styles.body}>No driver partner applications found.</Text> : null}
          {applications.map((application) => (
            <Pressable key={application.driverApplicationId} style={styles.applicationCard} onPress={() => void openApplication(application.driverApplicationId)}>
              <Text style={styles.applicationTitle}>{application.applicantName || "Driver applicant"}</Text>
              <Text style={styles.body}>{application.applicantEmail} · {application.applicantPhone}</Text>
              <Text style={styles.meta}>Reference: {application.applicationReference}</Text>
              <Text style={styles.meta}>{application.partnerType || "Partner type not supplied"} · {application.applyingAs || "Applicant type not supplied"}</Text>
              <Text style={styles.status}>{application.status}</Text>
              <Text style={styles.openButtonText}>Review application ›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function formatPolicyAcknowledgements(value: any) {
  if (!value) return "No published policy acknowledgements recorded.";
  try {
    const acknowledgements = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(acknowledgements) || acknowledgements.length === 0) {
      return "No published policy acknowledgements recorded.";
    }
    return acknowledgements
      .map((item: any) => `${item.title || "Policy document"} — version ${item.version} (ID: ${item.policyDocumentId})`)
      .join("\n");
  } catch {
    return "Policy acknowledgement data is invalid or unreadable.";
  }
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.includes("T") && !Number.isNaN(Date.parse(value))) return new Date(value).toLocaleString();
  return String(value);
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{formatValue(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 22 },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 7 },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 18, paddingBottom: 50 },
  applicationCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 16, marginBottom: 12 },
  applicationTitle: { color: NAVY, fontSize: 18, fontWeight: "800" },
  meta: { color: MUTED, fontSize: 12, marginTop: 5, lineHeight: 18 },
  body: { color: "#475569", fontSize: 13, lineHeight: 20, marginTop: 5 },
  status: { color: ORANGE, fontWeight: "800", marginTop: 10 },
  section: { color: NAVY, fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 9 },
  detailRow: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingVertical: 8 },
  detailLabel: { color: MUTED, fontSize: 11, fontWeight: "700" },
  detailValue: { color: NAVY, fontSize: 13, marginTop: 3 },
  documentCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 13, marginBottom: 10 },
  documentTitle: { color: NAVY, fontSize: 14, fontWeight: "800" },
  openButton: { alignSelf: "flex-start", backgroundColor: "#FFF7ED", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 },
  openButtonText: { color: "#C2410C", fontWeight: "800", fontSize: 12, marginTop: 8 },
  documentActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  approveButton: { backgroundColor: "#15803D", borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, alignItems: "center" },
  rejectButton: { backgroundColor: "#B91C1C", borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, alignItems: "center" },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  commentInput: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, padding: 12, color: NAVY },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  actions: { gap: 9, marginTop: 14 },
  secondaryButton: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, backgroundColor: "#FFFFFF", padding: 12, alignItems: "center" },
  secondaryText: { color: NAVY, fontWeight: "700", fontSize: 13 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", padding: 11, margin: 12, borderRadius: 8 },
  notice: { color: "#166534", backgroundColor: "#DCFCE7", padding: 11, margin: 12, borderRadius: 8 },
});
