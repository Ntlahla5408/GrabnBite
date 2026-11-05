import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
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
import {
  createDriverApplication,
  deleteDriverApplicationDocument,
  DriverApplication,
  DriverDocumentType,
  getMyDriverApplication,
  getPublishedPolicyDocuments,
  PublishedPolicyDocument,
  saveDriverApplicationDraft,
  submitDriverApplication,
  uploadDriverApplicationDocument,
} from "../services/driverApplicationService";

const NAVY = "#071B2C";
const ORANGE = "#F97316";
const MUTED = "#64748B";

const fieldGroups = [
  {
    title: "1. Personal information",
    fields: [
      ["fullLegalName", "Full legal name"], ["surname", "Surname"],
      ["preferredName", "Preferred name"], ["idOrPassportNumber", "South African ID / passport number"],
      ["dateOfBirth", "Date of birth (YYYY-MM-DD)"], ["nationality", "Nationality"],
      ["mobileNumber", "Mobile number"], ["alternativeContactNumber", "Alternative contact number"],
      ["emailAddress", "Email address"], ["residentialAddress", "Residential address"],
      ["suburbOrTownship", "Suburb / township"], ["cityOrTown", "City / town"],
      ["province", "Province"], ["postalCode", "Postal code"],
    ],
  },
  {
    title: "2. Partner and business information",
    fields: [
      ["registeredBusinessName", "Registered business name (if applicable)"],
      ["companyRegistrationNumber", "Company registration number"],
      ["businessAddress", "Business address"], ["businessRepresentative", "Business representative"],
      ["numberOfDrivers", "Number of drivers (fleet / company applicants)"],
    ],
  },
  {
    title: "3. Vehicle information",
    fields: [
      ["vehicleMake", "Vehicle make"], ["vehicleModel", "Vehicle model"],
      ["vehicleYear", "Vehicle year"], ["vehicleRegistration", "Registration number (if applicable)"],
      ["vehicleColour", "Vehicle colour"], ["vehicleType", "Vehicle type"],
      ["vehicleOwner", "Vehicle owner"],
    ],
  },
  {
    title: "4. Delivery equipment",
    fields: [["otherEquipment", "Other equipment"]],
  },
  {
    title: "5. Availability and service area",
    fields: [
      ["preferredProvince", "Preferred province"], ["preferredCityOrTown", "City / town"],
      ["preferredAreas", "Suburbs / areas"], ["workingDays", "Working days (e.g. Mon, Tue, Sat)"],
      ["availability", "Availability (Morning, Afternoon, Evening or Flexible)"],
      ["outsidePreferredArea", "Accept deliveries outside preferred area? (Yes / No / Subject to agreement)"],
    ],
  },
  {
    title: "6. Banking and payment details",
    fields: [
      ["accountHolderName", "Account holder's full name"], ["bankName", "Bank"],
      ["bankAccountNumber", "Account number"], ["accountType", "Account type"],
      ["branchCode", "Branch code"],
      ["accountHolderIdOrRegistrationNumber", "Account holder ID / registration number"],
    ],
  },
  {
    title: "7. Emergency contact",
    fields: [
      ["emergencyContactName", "Emergency contact full name"],
      ["emergencyContactRelationship", "Relationship"],
      ["emergencyContactNumber", "Contact number"],
      ["emergencyContactAlternativeNumber", "Alternative contact number"],
    ],
  },
  {
    title: "8. Experience and background",
    fields: [
      ["previousCompanyOrPlatform", "Previous company / platform"],
      ["experienceDuration", "Duration of experience"],
      ["previousDeliveryTypes", "Type of deliveries handled"],
      ["trainingDetails", "Training / certificate details"],
    ],
  },
  {
    title: "9. Electronic signature",
    fields: [
      ["signatureFullLegalName", "Applicant's full legal name"],
      ["signatureIdOrPassportNumber", "ID / passport number"],
      ["signatureEmailAddress", "Email address"],
      ["signatureMobileNumber", "Mobile number"],
    ],
  },
] as const;

const optionGroups = [
  { key: "partnerType", label: "Delivery partner type", values: ["Bicycle courier", "Motorcycle courier", "Scooter courier", "Private motor vehicle courier", "Other"] },
  { key: "applyingAs", label: "Applying as", values: ["Individual", "Registered delivery business", "Fleet owner", "Company representative"] },
  { key: "commercialDeliveryInsurance", label: "Does insurance cover commercial delivery use?", values: ["Yes", "No", "To be confirmed"] },
] as const;

const toggleGroups = [
  {
    title: "Vehicle compliance",
    fields: [
      ["isRoadworthy", "Vehicle is roadworthy"], ["isLicensed", "Vehicle is licensed"],
      ["isInsured", "Vehicle is insured"],
      ["requiresProfessionalDrivingPermit", "A professional driving permit is legally required"],
      ["requiresRoadworthiness", "Roadworthiness documentation is legally required"],
      ["vehicleOwnedByApplicant", "Vehicle is owned by the applicant"],
    ],
  },
  {
    title: "Delivery equipment",
    fields: [
      ["hasInsulatedDeliveryBag", "Insulated food delivery bag"],
      ["hasSecureTransportContainer", "Secure food transport container"],
      ["hasSmartphone", "Smartphone"], ["hasMobileInternet", "Mobile internet access"],
      ["hasPhoneHolder", "Phone holder"], ["hasProtectiveClothing", "Protective clothing"],
      ["hasHelmet", "Helmet (where applicable)"], ["hasReflectiveEquipment", "Reflective / visibility equipment"],
      ["needsEquipmentAssistance", "Need assistance obtaining delivery equipment?"],
    ],
  },
  {
    title: "Experience",
    fields: [
      ["hasDeliveryExperience", "Previously worked as a delivery driver or courier?"],
      ["hasFoodDeliveryExperience", "Food delivery experience?"],
      ["hasRelevantTraining", "Relevant training / certificates?"],
    ],
  },
  {
    title: "Required policy acknowledgements",
    fields: [
      ["acknowledgedDeliveryPartnerAgreement", "Delivery Partner Agreement"],
      ["acknowledgedCollectionProcedures", "Delivery and Collection Procedures"],
      ["acknowledgedCodeOfConduct", "Delivery Partner Code of Conduct"],
      ["acknowledgedFailedDeliveryPolicy", "Failed and Delayed Delivery Policy"],
      ["acknowledgedAccidentAndLiabilityPolicy", "Accident, Damage and Liability Policy"],
      ["acknowledgedPaymentSchedule", "Delivery Partner Payment Schedule"],
    ],
  },
  {
    title: "Declarations and consent",
    fields: [
      ["confirmedInformationAccurate", "The information provided is accurate and complete."],
      ["confirmedDocumentAuthority", "Documents belong to me or are submitted with proper authority."],
      ["consentedToVerification", "I consent to identity, licence, vehicle and information verification."],
      ["confirmedLegalCompliance", "I will maintain the licences, permits, vehicle documents and insurance required."],
      ["acknowledgedNoGuaranteedAcceptance", "I understand that submitting this application does not guarantee acceptance."],
      ["acceptedPlatformPolicies", "I agree to comply with GrubnBite policies once accepted and activated."],
      ["acknowledgedCompensationSeparation", "I understand courier compensation is separate from the customer delivery service fee."],
      ["acknowledgedWorkingRelationship", "I understand the legal nature of the working relationship is determined by applicable law and facts."],
      ["consentedToPersonalInformationProcessing", "I consent to processing my information for onboarding, verification, payment, safety and legal compliance."],
      ["acknowledgedPopia", "I understand my personal information will be handled in accordance with POPIA."],
    ],
  },
] as const;

const documentTypes: { type: DriverDocumentType; label: string; note: string }[] = [
  { type: "IdentityDocument", label: "Certified ID or passport", note: "Required" },
  { type: "ProofOfAddress", label: "Proof of residential address", note: "Required" },
  { type: "ProfilePhotograph", label: "Recent profile photograph", note: "Required" },
  { type: "DriversLicence", label: "Valid driver's licence", note: "Where required for your vehicle" },
  { type: "ProfessionalDrivingPermit", label: "Professional driving permit", note: "Where legally required" },
  { type: "BusinessRegistration", label: "Business registration documents", note: "For business / fleet applicants" },
  { type: "VehicleRegistrationCertificate", label: "Vehicle registration certificate", note: "For motor vehicles" },
  { type: "VehicleLicence", label: "Valid vehicle licence documentation", note: "For motor vehicles" },
  { type: "RoadworthinessCertificate", label: "Roadworthiness documentation", note: "Where required" },
  { type: "ProofOfInsurance", label: "Proof of insurance", note: "For motor vehicles" },
  { type: "ThirdPartyVehiclePermission", label: "Permission to use vehicle", note: "If vehicle belongs to someone else" },
  { type: "BankConfirmation", label: "Bank confirmation letter / statement", note: "Required" },
];

const initialForm: Record<string, any> = {
  acknowledgedDeliveryPartnerAgreement: false,
  acknowledgedCollectionProcedures: false,
  acknowledgedCodeOfConduct: false,
  acknowledgedFailedDeliveryPolicy: false,
  acknowledgedAccidentAndLiabilityPolicy: false,
  acknowledgedPaymentSchedule: false,
  confirmedInformationAccurate: false,
  confirmedDocumentAuthority: false,
  consentedToVerification: false,
  confirmedLegalCompliance: false,
  acknowledgedNoGuaranteedAcceptance: false,
  acceptedPlatformPolicies: false,
  acknowledgedCompensationSeparation: false,
  acknowledgedWorkingRelationship: false,
  consentedToPersonalInformationProcessing: false,
  acknowledgedPopia: false,
  hasInsulatedDeliveryBag: false,
  hasSecureTransportContainer: false,
  hasSmartphone: false,
  hasMobileInternet: false,
  hasPhoneHolder: false,
  hasProtectiveClothing: false,
  hasHelmet: false,
  hasReflectiveEquipment: false,
  requiresDriversLicence: true,
  requiresProfessionalDrivingPermit: false,
  requiresRoadworthiness: false,
  bankAccountNumber: "",
  signatureMethod: "EmailVerification",
};

export default function DriverApplicationScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [policies, setPolicies] = useState<PublishedPolicyDocument[]>([]);
  const [acknowledgedPolicyIds, setAcknowledgedPolicyIds] = useState<number[]>([]);
  const [viewedPolicyIds, setViewedPolicyIds] = useState<number[]>([]);
  const [policiesError, setPoliciesError] = useState("");

  const loadApplication = useCallback(async () => {
    if (!token) return;
    try {
      await createDriverApplication(token);
      const result = await getMyDriverApplication(token);
      setApplication(result);
      setForm({ ...initialForm, ...result, bankAccountNumber: "", signatureMethod: "EmailVerification" });

      try {
        const publishedPolicies = await getPublishedPolicyDocuments();
        setPolicies(publishedPolicies);
        setPoliciesError("");

        let savedAcknowledgements: { policyDocumentId: number; version: number }[] = [];
        try {
          savedAcknowledgements = result.policyVersionsOrLinks
            ? JSON.parse(result.policyVersionsOrLinks)
            : [];
        } catch {
          savedAcknowledgements = [];
        }

        const currentAcknowledgements = publishedPolicies
          .filter((policy) => savedAcknowledgements.some(
            (saved) => saved.policyDocumentId === policy.policyDocumentId && saved.version === policy.version,
          ))
          .map((policy) => policy.policyDocumentId);
        setAcknowledgedPolicyIds(currentAcknowledgements);
        setViewedPolicyIds(currentAcknowledgements);
      } catch (policyError: any) {
        setPolicies([]);
        setAcknowledgedPolicyIds([]);
        setViewedPolicyIds([]);
        setPoliciesError(policyError?.message || "Unable to load current published policies.");
      }
      setError("");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load your driver application.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "Driver") {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start async data loading; state updates occur after the request resolves.
    void loadApplication();
  }, [authLoading, token, user?.role, loadApplication]);

  const update = (key: string, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = () => {
    const {
      driverApplicationId, applicationReference, status, documents,
      maskedAccountNumber, createdAt, updatedAt, submittedAt,
      reviewedByUserId, reviewedAt, adminComments, rejectionReason,
      documentsRequestedMessage, ...payload
    } = form;
    return {
      ...payload,
      dateOfBirth: payload.dateOfBirth || null,
      vehicleYear: payload.vehicleYear ? Number(payload.vehicleYear) : null,
      numberOfDrivers: payload.numberOfDrivers ? Number(payload.numberOfDrivers) : null,
      signatureMethod: "EmailVerification",
      policyVersionsOrLinks: JSON.stringify(
        policies
          .filter((policy) => acknowledgedPolicyIds.includes(policy.policyDocumentId))
          .map((policy) => ({
            policyDocumentId: policy.policyDocumentId,
            title: policy.title,
            version: policy.version,
          })),
      ),
    };
  };

  const saveDraft = async (showAlert = true) => {
    if (!token) return false;

    const numberOfDriversValue = String(form.numberOfDrivers ?? "").trim();
    if (numberOfDriversValue) {
      const numberOfDrivers = Number(numberOfDriversValue);
      if (!Number.isSafeInteger(numberOfDrivers) || numberOfDrivers < 1 || numberOfDrivers > 1000) {
        setError("Number of drivers must be a whole number between 1 and 1,000.");
        return false;
      }
    }

    const vehicleYearValue = String(form.vehicleYear ?? "").trim();
    if (vehicleYearValue) {
      const vehicleYear = Number(vehicleYearValue);
      const latestAllowedYear = new Date().getFullYear() + 1;
      if (!Number.isInteger(vehicleYear) || vehicleYear < 1900 || vehicleYear > latestAllowedYear) {
        setError(`Vehicle year must be between 1900 and ${latestAllowedYear}.`);
        return false;
      }
    }

    try {
      setSaving(true);
      setError("");
      await saveDriverApplicationDraft(buildPayload(), token);
      await loadApplication();
      if (showAlert) setNotice("Your driver partner application draft has been saved.");
      return true;
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to save your application.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (documentType: DriverDocumentType) => {
    if (!token) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setUploadingType(documentType);
      setError("");
      await uploadDriverApplicationDocument(
        documentType,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || "application/pdf" },
        token,
      );
      await loadApplication();
      setNotice("Document uploaded successfully.");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to upload this document.");
    } finally {
      setUploadingType(null);
    }
  };

  const removeDocument = async (documentId: number) => {
    if (!token) return;
    try {
      await deleteDriverApplicationDocument(documentId, token);
      await loadApplication();
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to remove this document.");
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (policiesError) {
      setError("Current policy documents could not be loaded. Refresh the application before submitting.");
      return;
    }
    const unacknowledgedPolicies = policies.filter(
      (policy) => !acknowledgedPolicyIds.includes(policy.policyDocumentId),
    );
    if (unacknowledgedPolicies.length > 0) {
      setError("Read and acknowledge every current policy document before submitting: " +
        unacknowledgedPolicies.map((policy) => policy.title).join(", "));
      return;
    }
    const saved = await saveDraft(false);
    if (!saved) return;
    try {
      setSubmitting(true);
      setError("");
      const result = await submitDriverApplication(token);
      setNotice(result?.message || "Your application has been submitted for review.");
      await loadApplication();
    } catch (requestError: any) {
      const missing = requestError?.data?.missingItems;
      setError(
        Array.isArray(missing) && missing.length
          ? "Complete these items before submitting: " + missing.join(", ")
          : requestError?.message || "Unable to submit your application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={ORANGE} /><Text style={styles.muted}>Loading your application...</Text></View>;
  }

  if (!token || user?.role !== "Driver" || !application) {
    return <View style={styles.center}><Text style={styles.error}>{error || "Your driver application could not be found."}</Text></View>;
  }

  const editable = application.status === "Draft" || application.status === "DocumentsRequired";

  if (!editable) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/driver-dashboard")}><Text style={styles.back}>‹ Driver dashboard</Text></Pressable>
          <Text style={styles.title}>Delivery partner application</Text>
          <Text style={styles.subtitle}>Reference: {application.applicationReference}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.status}>{application.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</Text>
          <Text style={styles.body}>
            {application.status === "PendingReview" ? "Your application and supporting documents have been submitted. An administrator will review them. You cannot accept deliveries until approval." :
             application.status === "UnderVerification" ? "Your application is being verified. You cannot accept deliveries until approval." :
             application.status === "Approved" ? "Your application has been approved. You can now use the driver dashboard." :
             "Your application was rejected. Review the administrator feedback below."}
          </Text>
          {application.documentsRequestedMessage ? <Text style={styles.notice}>Additional documents requested: {application.documentsRequestedMessage}</Text> : null}
          {application.rejectionReason ? <Text style={styles.error}>{application.rejectionReason}</Text> : null}
          <Text style={styles.section}>Uploaded documents</Text>
          {(application.documents || []).map((document) => (
            <View key={document.driverApplicationDocumentId} style={styles.documentRow}>
              <Text style={styles.documentName}>{document.documentType}: {document.originalFileName}</Text>
              <Text style={styles.muted}>{document.verificationStatus}</Text>
            </View>
          ))}
          <Pressable style={styles.secondaryButton} onPress={loadApplication}><Text style={styles.secondaryText}>Refresh application status</Text></Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/driver-dashboard")}><Text style={styles.back}>‹ Driver dashboard</Text></Pressable>
        <Text style={styles.title}>Delivery partner registration</Text>
        <Text style={styles.subtitle}>Reference: {application.applicationReference} · Complete the form and upload your supporting documents. Your application must be approved before you can accept deliveries.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {application.documentsRequestedMessage ? <Text style={styles.notice}>Additional information requested by GrubnBite: {application.documentsRequestedMessage}</Text> : null}
        {application.rejectionReason ? <Text style={styles.error}>{application.rejectionReason}</Text> : null}

        <Text style={styles.section}>Delivery partner category</Text>
        {optionGroups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.label}>{group.label}</Text>
            <View style={styles.chips}>
              {group.values.map((value) => (
                <Pressable key={value} onPress={() => update(group.key, value)} style={[styles.chip, form[group.key] === value && styles.chipSelected]}>
                  <Text style={[styles.chipText, form[group.key] === value && styles.chipTextSelected]}>{value}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {fieldGroups.map((group) => (
          <View key={group.title}>
            <Text style={styles.section}>{group.title}</Text>
            {group.fields.map(([key, label]) => (
              <View key={key} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={String(form[key] ?? "")}
                  onChangeText={(value) => update(key, value)}
                  placeholder={label}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize={key.toLowerCase().includes("email") ? "none" : "sentences"}
                  keyboardType={key.toLowerCase().includes("number") || key === "vehicleYear" || key === "postalCode" || key === "branchCode" ? "numeric" : "default"}
                  secureTextEntry={key === "bankAccountNumber"}
                />
              </View>
            ))}
            {group.title === "6. Banking and payment details" && application.maskedAccountNumber ? (
              <Text style={styles.muted}>An encrypted bank account is already on file. Leave the account number blank to keep it unchanged.</Text>
            ) : null}
          </View>
        ))}

        <Text style={styles.section}>Vehicle and eligibility declarations</Text>
        {toggleGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.subsection}>{group.title}</Text>
            {group.fields.map(([key, label]) => (
              <Pressable key={key} style={styles.toggleRow} onPress={() => update(key, !Boolean(form[key]))}>
                <View style={[styles.checkbox, form[key] && styles.checkboxSelected]}>{form[key] ? <Text style={styles.checkmark}>✓</Text> : null}</View>
                <Text style={styles.toggleLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <Text style={styles.section}>10. Required supporting documents</Text>
        <Text style={styles.muted}>Upload PDF, JPEG, PNG or WebP files. Maximum file size is controlled by the platform. Some documents apply only to certain vehicle or business types.</Text>
        {documentTypes.map((item) => {
          const uploaded = (application.documents || []).filter((document) => document.documentType === item.type);
          return (
            <View key={item.type} style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentName}>{item.label}</Text>
                  <Text style={styles.muted}>{item.note}</Text>
                </View>
                <Pressable style={styles.uploadButton} onPress={() => uploadDocument(item.type)} disabled={uploadingType === item.type}>
                  {uploadingType === item.type ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.uploadButtonText}>Upload</Text>}
                </Pressable>
              </View>
              {uploaded.map((document) => (
                <View key={document.driverApplicationDocumentId} style={styles.documentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.documentName}>{document.originalFileName}</Text>
                    <Text style={styles.muted}>Review: {document.verificationStatus}</Text>
                  </View>
                  {document.verificationStatus === "Pending" ? (
                    <Pressable onPress={() => removeDocument(document.driverApplicationDocumentId)}><Text style={styles.removeText}>Remove</Text></Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.section}>11. Current GrubnBite policies</Text>
        <Text style={styles.muted}>
          Open each published policy document, read it carefully, then tick the acknowledgement for that exact version. Your acknowledgements and policy version numbers are recorded with this application.
        </Text>
        {policiesError ? <Text style={styles.error}>{policiesError}</Text> : null}
        {policies.length === 0 && !policiesError ? (
          <Text style={styles.muted}>There are currently no published policy documents requiring acknowledgement.</Text>
        ) : null}
        {policies.map((policy) => {
          const acknowledged = acknowledgedPolicyIds.includes(policy.policyDocumentId);
          return (
            <View key={policy.policyDocumentId} style={styles.uploadCard}>
              <Text style={styles.documentName}>{policy.title}</Text>
              <Text style={styles.muted}>Version {policy.version}</Text>
              {policy.description ? <Text style={styles.body}>{policy.description}</Text> : null}
              <Pressable
                style={styles.uploadButton}
                onPress={() => {
                  setViewedPolicyIds((current) => current.includes(policy.policyDocumentId)
                    ? current
                    : [...current, policy.policyDocumentId]);
                  router.push({ pathname: "/policy-reader", params: { id: String(policy.policyDocumentId) } });
                }}
              >
                <Text style={styles.uploadButtonText}>OPEN AND READ POLICY</Text>
              </Pressable>
              <Pressable
                style={styles.toggleRow}
                disabled={!viewedPolicyIds.includes(policy.policyDocumentId)}
                onPress={() => setAcknowledgedPolicyIds((current) =>
                  acknowledged
                    ? current.filter((id) => id !== policy.policyDocumentId)
                    : [...current, policy.policyDocumentId],
                )}
              >
                <View style={[styles.checkbox, acknowledged && styles.checkboxSelected]}>
                  {acknowledged ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.toggleLabel}>I have read and agree to this policy, version {policy.version}.</Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.muted}>Submitting this application does not guarantee acceptance. The application will remain pending until reviewed and approved by GrubnBite.</Text>
        <Pressable style={[styles.primaryButton, (saving || submitting) && styles.disabled]} onPress={() => void saveDraft()} disabled={saving || submitting}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>SAVE APPLICATION DRAFT</Text>}
        </Pressable>
        {showSubmitConfirmation ? (
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationText}>
              Submit your completed delivery partner application for administrator review? You will not be able to edit it unless the administrator requests additional information.
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable
                style={styles.cancelSubmitButton}
                onPress={() => setShowSubmitConfirmation(false)}
                disabled={saving || submitting}
              >
                <Text style={styles.cancelSubmitText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmSubmitButton, (saving || submitting) && styles.disabled]}
                onPress={() => {
                  setShowSubmitConfirmation(false);
                  void handleSubmit();
                }}
                disabled={saving || submitting}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>CONFIRM SUBMISSION</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.submitButton, (saving || submitting) && styles.disabled]}
            onPress={() => setShowSubmitConfirmation(true)}
            disabled={saving || submitting}
          >
            <Text style={styles.primaryButtonText}>SUBMIT FOR APPROVAL</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 22 },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 7 },
  content: { width: "100%", maxWidth: 820, alignSelf: "center", padding: 18, paddingBottom: 50 },
  section: { color: NAVY, fontSize: 18, fontWeight: "800", marginTop: 22, marginBottom: 12 },
  subsection: { color: NAVY, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  group: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 14, marginBottom: 14 },
  field: { marginBottom: 13 },
  label: { color: NAVY, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFFFFF", color: NAVY },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11 },
  chipSelected: { borderColor: ORANGE, backgroundColor: "#FFF7ED" },
  chipText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: "#C2410C" },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  checkbox: { width: 21, height: 21, borderWidth: 1, borderColor: "#94A3B8", borderRadius: 5, alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkmark: { color: "#FFFFFF", fontWeight: "900" },
  toggleLabel: { flex: 1, color: "#334155", fontSize: 13, lineHeight: 18 },
  uploadCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 11, padding: 13, marginBottom: 10 },
  uploadHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  uploadButton: { backgroundColor: NAVY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  uploadButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  documentName: { color: NAVY, fontSize: 13, fontWeight: "700" },
  documentRow: { borderTopWidth: 1, borderTopColor: "#E2E8F0", marginTop: 10, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  removeText: { color: "#B91C1C", fontWeight: "700", fontSize: 12 },
  muted: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 },
  status: { color: ORANGE, fontSize: 18, fontWeight: "800" },
  body: { color: "#475569", fontSize: 14, lineHeight: 22, marginTop: 10 },
  notice: { color: "#9A3412", backgroundColor: "#FFF7ED", borderRadius: 9, padding: 12, marginVertical: 10, lineHeight: 19 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", borderRadius: 9, padding: 12, marginVertical: 10, lineHeight: 19 },
  primaryButton: { minHeight: 50, backgroundColor: NAVY, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 20 },
  submitButton: { minHeight: 50, backgroundColor: ORANGE, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 10 },
  confirmationCard: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FDBA74", borderRadius: 10, padding: 14, marginTop: 12 },
  confirmationText: { color: NAVY, fontSize: 13, lineHeight: 20 },
  confirmationActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  cancelSubmitButton: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  cancelSubmitText: { color: NAVY, fontWeight: "800", fontSize: 12 },
  confirmSubmitButton: { flex: 1, minHeight: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: ORANGE, paddingHorizontal: 8 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  secondaryButton: { minHeight: 46, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF", borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 18 },
  secondaryText: { color: NAVY, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  center: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 24 },
});
