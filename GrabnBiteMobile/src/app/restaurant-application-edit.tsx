import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import {
  getRestaurantApplication,
  RestaurantApplicationDraft,
  saveRestaurantApplicationDraft,
  SaveRestaurantApplicationDraft,
  RestaurantDocumentType,
  uploadRestaurantApplicationDocument,
  getRestaurantApplicationDocumentDownloadUrl,
  deleteRestaurantApplicationDocument,
} from "../services/restaurantApplicationService";

type DraftForm = {
  tradingName: string;
  registeredBusinessName: string;
  cipcRegistrationNumber: string;
  restaurantCategory: string;
  physicalAddress: string;
  city: string;
  restaurantContactNumber: string;
  businessEmail: string;
  websiteOrSocialMediaUrl: string;
  representativeFullName: string;
  representativePosition: string;
  representativeMobileNumber: string;
  representativeEmail: string;
  hasAuthorityToRepresent: boolean | null;
  offersCustomerCollection: boolean;
  offersRestaurantDelivery: boolean;
  offersGrubnBiteDelivery: boolean;
  averagePreparationTimeMinutes: string;
  maximumDeliveryDistanceKm: string;
  deliveryInstructions: string;
  commissionOfferAccepted: boolean | null;
  operatingHours: {
    dayOfWeek: string;
    isOpen: boolean;
    openingTime: string | null;
    closingTime: string | null;
  }[];
};

const emptyForm: DraftForm = {
  tradingName: "",
  registeredBusinessName: "",
  cipcRegistrationNumber: "",
  restaurantCategory: "",
  physicalAddress: "",
  city: "",
  restaurantContactNumber: "",
  businessEmail: "",
  websiteOrSocialMediaUrl: "",
  representativeFullName: "",
  representativePosition: "",
  representativeMobileNumber: "",
  representativeEmail: "",
  hasAuthorityToRepresent: null,
  offersCustomerCollection: false,
  offersRestaurantDelivery: false,
  offersGrubnBiteDelivery: false,
  averagePreparationTimeMinutes: "",
  maximumDeliveryDistanceKm: "",
  deliveryInstructions: "",
  commissionOfferAccepted: null,
  operatingHours: [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ].map((dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    openingTime: null,
    closingTime: null,
  })),
};

export default function RestaurantApplicationEditScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { token, user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<RestaurantApplicationDraft | null>(null);
  const [form, setForm] = useState<DraftForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<RestaurantDocumentType>("CipcCertificate");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "Restaurant") {
      router.replace("/login");
      return;
    }

    const id = Number(applicationId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("A valid application was not selected.");
      setLoading(false);
      return;
    }

    let active = true;
    getRestaurantApplication(id, token)
      .then((result) => {
        if (!active) return;
        setApplication(result);
        setForm({
          tradingName: result.tradingName ?? "",
          registeredBusinessName: result.registeredBusinessName ?? "",
          cipcRegistrationNumber: result.cipcRegistrationNumber ?? "",
          restaurantCategory: result.restaurantCategory ?? "",
          physicalAddress: result.physicalAddress ?? "",
          city: result.city ?? "",
          restaurantContactNumber: result.restaurantContactNumber ?? "",
          businessEmail: result.businessEmail ?? "",
          websiteOrSocialMediaUrl: result.websiteOrSocialMediaUrl ?? "",
          representativeFullName: result.representativeFullName ?? "",
          representativePosition: result.representativePosition ?? "",
          representativeMobileNumber: result.representativeMobileNumber ?? "",
          representativeEmail: result.representativeEmail ?? "",
          hasAuthorityToRepresent: result.hasAuthorityToRepresent,
          offersCustomerCollection: result.offersCustomerCollection ?? false,
          offersRestaurantDelivery: result.offersRestaurantDelivery ?? false,
          offersGrubnBiteDelivery: result.offersGrubnBiteDelivery ?? false,
          averagePreparationTimeMinutes: result.averagePreparationTimeMinutes?.toString() ?? "",
          maximumDeliveryDistanceKm: result.maximumDeliveryDistanceKm?.toString() ?? "",
          deliveryInstructions: result.deliveryInstructions ?? "",
          commissionOfferAccepted: result.commissionOfferAccepted,
          operatingHours: [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
          ].map((dayOfWeek) => {
            const saved = result.operatingHours.find((hour) => hour.dayOfWeek === dayOfWeek);
            return {
              dayOfWeek,
              isOpen: saved?.isOpen ?? false,
              openingTime: saved?.openingTime ?? null,
              closingTime: saved?.closingTime ?? null,
            };
          }),
        });
      })
      .catch((requestError: any) => {
        if (active) setError(requestError?.message || "Unable to load this application.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applicationId, authLoading, token, user?.role]);

  const update = <K extends keyof DraftForm,>(key: K, value: DraftForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!token || !application) return;

    const preparationTime = form.averagePreparationTimeMinutes.trim()
      ? Number(form.averagePreparationTimeMinutes)
      : null;
    const deliveryDistance = form.maximumDeliveryDistanceKm.trim()
      ? Number(form.maximumDeliveryDistanceKm)
      : null;

    if (preparationTime !== null && (!Number.isInteger(preparationTime) || preparationTime < 1 || preparationTime > 600)) {
      setError("Preparation time must be between 1 and 600 minutes.");
      return;
    }

    if (deliveryDistance !== null && (!Number.isFinite(deliveryDistance) || deliveryDistance < 0 || deliveryDistance > 500)) {
      setError("Maximum delivery distance must be between 0 and 500 km.");
      return;
    }

    const payload: SaveRestaurantApplicationDraft = {
      tradingName: form.tradingName,
      registeredBusinessName: form.registeredBusinessName,
      cipcRegistrationNumber: form.cipcRegistrationNumber,
      restaurantCategory: form.restaurantCategory,
      physicalAddress: form.physicalAddress,
      city: form.city,
      restaurantContactNumber: form.restaurantContactNumber,
      businessEmail: form.businessEmail,
      websiteOrSocialMediaUrl: form.websiteOrSocialMediaUrl,
      representativeFullName: form.representativeFullName,
      representativePosition: form.representativePosition,
      representativeMobileNumber: form.representativeMobileNumber,
      representativeEmail: form.representativeEmail,
      hasAuthorityToRepresent: form.hasAuthorityToRepresent,
      offersCustomerCollection: form.offersCustomerCollection,
      offersRestaurantDelivery: form.offersRestaurantDelivery,
      offersGrubnBiteDelivery: form.offersGrubnBiteDelivery,
      averagePreparationTimeMinutes: preparationTime,
      maximumDeliveryDistanceKm: deliveryDistance,
      deliveryInstructions: form.deliveryInstructions,
      commissionOfferAccepted: form.commissionOfferAccepted,
      operatingHours: form.operatingHours,
    };

    try {
      setSaving(true);
      setError("");
      await saveRestaurantApplicationDraft(application.restaurantApplicationId, payload, token);
      Alert.alert("Draft saved", "Your restaurant application details have been saved.");
      router.replace("/restaurant-profile");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to save your application.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.muted}>Loading application...</Text>
      </View>
    );
  }

  if (!token || user?.role !== "Restaurant") return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/restaurant-profile")}>
          <Text style={styles.backText}>‹  Applications</Text>
        </Pressable>
        <Text style={styles.title}>Restaurant application</Text>
        <Text style={styles.subtitle}>
          Reference: {application?.applicationReference ?? "Unavailable"}
        </Text>
        <Text style={styles.status}>Status: {application?.status ?? "Unknown"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {application?.documentsRequestedMessage ? (
          <Text style={styles.notice}>Administrator request: {application.documentsRequestedMessage}</Text>
        ) : null}
        {application?.adminComments ? (
          <Text style={styles.notice}>Review feedback: {application.adminComments}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Business information</Text>
        <Field label="Trading name *" value={form.tradingName} onChangeText={(value) => update("tradingName", value)} />
        <Field label="Registered business name" value={form.registeredBusinessName} onChangeText={(value) => update("registeredBusinessName", value)} />
        <Field label="CIPC registration number" value={form.cipcRegistrationNumber} onChangeText={(value) => update("cipcRegistrationNumber", value)} />
        <Field label="Restaurant category" value={form.restaurantCategory} onChangeText={(value) => update("restaurantCategory", value)} placeholder="e.g. Fast food, Café, Bakery" />
        <Field label="Physical address *" value={form.physicalAddress} onChangeText={(value) => update("physicalAddress", value)} />
        <Field label="City *" value={form.city} onChangeText={(value) => update("city", value)} />
        <Field label="Business contact number" value={form.restaurantContactNumber} onChangeText={(value) => update("restaurantContactNumber", value)} keyboardType="phone-pad" />
        <Field label="Business email" value={form.businessEmail} onChangeText={(value) => update("businessEmail", value)} keyboardType="email-address" />
        <Field label="Website or social media URL" value={form.websiteOrSocialMediaUrl} onChangeText={(value) => update("websiteOrSocialMediaUrl", value)} autoCapitalize="none" />

        <Text style={styles.sectionTitle}>Authorised representative</Text>
        <Field label="Full name" value={form.representativeFullName} onChangeText={(value) => update("representativeFullName", value)} />
        <Field label="Position in business" value={form.representativePosition} onChangeText={(value) => update("representativePosition", value)} />
        <Field label="Mobile number" value={form.representativeMobileNumber} onChangeText={(value) => update("representativeMobileNumber", value)} keyboardType="phone-pad" />
        <Field label="Email address" value={form.representativeEmail} onChangeText={(value) => update("representativeEmail", value)} keyboardType="email-address" />
        <Choice label="I am authorised to represent this business" value={form.hasAuthorityToRepresent} onChange={(value) => update("hasAuthorityToRepresent", value)} />

        <Text style={styles.sectionTitle}>Fulfilment preferences</Text>
        <Toggle label="Customer collection" value={form.offersCustomerCollection} onChange={(value) => update("offersCustomerCollection", value)} />
        <Toggle label="Restaurant-managed delivery" value={form.offersRestaurantDelivery} onChange={(value) => update("offersRestaurantDelivery", value)} />
        <Toggle label="GrubnBite-arranged delivery" value={form.offersGrubnBiteDelivery} onChange={(value) => update("offersGrubnBiteDelivery", value)} />
        <Field label="Average preparation time (minutes)" value={form.averagePreparationTimeMinutes} onChangeText={(value) => update("averagePreparationTimeMinutes", value)} keyboardType="numeric" />
        <Field label="Maximum delivery distance (km)" value={form.maximumDeliveryDistanceKm} onChangeText={(value) => update("maximumDeliveryDistanceKm", value)} keyboardType="decimal-pad" />
        <Field label="Delivery instructions" value={form.deliveryInstructions} onChangeText={(value) => update("deliveryInstructions", value)} multiline />

        <Text style={styles.sectionTitle}>Operating hours</Text>
        <Text style={styles.helper}>
          Set the days and times when customers can order from your restaurant.
        </Text>
        {form.operatingHours.map((hour, index) => (
          <View key={hour.dayOfWeek} style={styles.hoursRow}>
            <Toggle
              label={hour.dayOfWeek}
              value={hour.isOpen}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  operatingHours: current.operatingHours.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, isOpen: value } : item,
                  ),
                }))
              }
            />
            {hour.isOpen ? (
              <View style={styles.timeFields}>
                <TextInput
                  value={hour.openingTime ?? ""}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      operatingHours: current.operatingHours.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, openingTime: value } : item,
                      ),
                    }))
                  }
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                  maxLength={5}
                />
                <Text style={styles.timeSeparator}>to</Text>
                <TextInput
                  value={hour.closingTime ?? ""}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      operatingHours: current.operatingHours.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, closingTime: value } : item,
                      ),
                    }))
                  }
                  placeholder="17:00"
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                  maxLength={5}
                />
              </View>
            ) : null}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Supporting documents</Text>
        <Text style={styles.helper}>
          Upload clear PDF or image copies. Files are stored privately and can only be accessed through an authenticated, short-lived download link.
        </Text>
        <View style={styles.documentTypes}>
          {([
            ["CipcCertificate", "CIPC certificate"],
            ["FoodPremisesCertificate", "Food premises certificate"],
            ["IdentityOrAuthority", "Identity / authority"],
            ["BankConfirmation", "Bank confirmation"],
            ["Other", "Other"],
          ] as [RestaurantDocumentType, string][]).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.documentTypeButton, selectedDocumentType === value && styles.documentTypeSelected]}
              onPress={() => setSelectedDocumentType(value)}
            >
              <Text style={[styles.documentTypeText, selectedDocumentType === value && styles.documentTypeTextSelected]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.uploadButton, uploading && styles.disabled]}
          disabled={uploading || !application || (application.status !== "Draft" && application.status !== "DocumentsRequired")}
          onPress={async () => {
            if (!token || !application) return;
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
                copyToCacheDirectory: true,
                multiple: false,
              });
              if (result.canceled || !result.assets?.[0]) return;
              const asset = result.assets[0];
              const mimeType = asset.mimeType || "application/octet-stream";
              if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
                setError("Choose a PDF, JPEG, PNG or WebP file.");
                return;
              }
              setUploading(true);
              setError("");
              await uploadRestaurantApplicationDocument(
                application.restaurantApplicationId,
                selectedDocumentType,
                { uri: asset.uri, name: asset.name, mimeType },
                token,
              );
              const refreshed = await getRestaurantApplication(application.restaurantApplicationId, token);
              setApplication(refreshed);
              Alert.alert("Document uploaded", "Your supporting document has been uploaded.");
            } catch (uploadError: any) {
              setError(uploadError?.message || "Unable to upload this document.");
            } finally {
              setUploading(false);
            }
          }}
        >
          {uploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Choose and upload document</Text>}
        </Pressable>
        {application?.documents.length ? (
          application.documents.map((document) => (
            <View key={document.restaurantDocumentId} style={styles.documentCard}>
              <Text style={styles.documentName}>{document.originalFileName}</Text>
              <Text style={styles.documentMeta}>
                {document.documentType.replace(/([a-z])([A-Z])/g, "$1 $2")} · {document.verificationStatus}
              </Text>
              {document.adminComment ? <Text style={styles.notice}>{document.adminComment}</Text> : null}
              <View style={styles.documentActions}>
                <Pressable
                  onPress={async () => {
                    try {
                      const result = await getRestaurantApplicationDocumentDownloadUrl(
                        application.restaurantApplicationId,
                        document.restaurantDocumentId,
                        token!,
                      );
                      await Linking.openURL(result.signedUrl);
                    } catch (downloadError: any) {
                      setError(downloadError?.message || "Unable to open this document.");
                    }
                  }}
                >
                  <Text style={styles.documentActionText}>View</Text>
                </Pressable>
                {(application.status === "Draft" || application.status === "DocumentsRequired") &&
                  document.verificationStatus === "Pending" ? (
                    <Pressable
                      onPress={() => Alert.alert(
                        "Remove document?",
                        "This will permanently remove the uploaded file.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await deleteRestaurantApplicationDocument(
                                  application.restaurantApplicationId,
                                  document.restaurantDocumentId,
                                  token!,
                                );
                                const refreshed = await getRestaurantApplication(application.restaurantApplicationId, token!);
                                setApplication(refreshed);
                              } catch (deleteError: any) {
                                setError(deleteError?.message || "Unable to remove this document.");
                              }
                            },
                          },
                        ],
                      )}
                    >
                      <Text style={styles.documentDeleteText}>Remove</Text>
                    </Pressable>
                  ) : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyDocuments}>No supporting documents uploaded yet.</Text>
        )}

        <Text style={styles.sectionTitle}>Commission offer</Text>
        <Choice label="I acknowledge and accept the commission offer presented during onboarding" value={form.commissionOfferAccepted} onChange={(value) => update("commissionOfferAccepted", value)} />

        <Text style={styles.helper}>
          Saving stores your progress only. It does not submit the application for approval.
        </Text>

        <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save draft</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  autoCapitalize,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric" | "decimal-pad";
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? "sentences"}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94A3B8"
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable style={styles.choiceRow} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value && styles.checkboxSelected]}>
        {value ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function Choice({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceButtons}>
        <Pressable style={[styles.choiceButton, value === true && styles.choiceButtonSelected]} onPress={() => onChange(true)}>
          <Text style={[styles.choiceButtonText, value === true && styles.choiceButtonTextSelected]}>Yes</Text>
        </Pressable>
        <Pressable style={[styles.choiceButton, value === false && styles.choiceButtonSelected]} onPress={() => onChange(false)}>
          <Text style={[styles.choiceButtonText, value === false && styles.choiceButtonTextSelected]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#071B2C", paddingHorizontal: 22, paddingTop: 54, paddingBottom: 22 },
  backText: { color: "#FDBA74", fontSize: 14, fontWeight: "700", marginBottom: 16 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 13, marginTop: 8 },
  status: { color: "#FDBA74", fontSize: 12, fontWeight: "700", marginTop: 6 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, paddingBottom: 50 },
  sectionTitle: { color: "#071B2C", fontSize: 19, fontWeight: "800", marginTop: 22, marginBottom: 12 },
  field: { marginBottom: 13 },
  label: { color: "#334155", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 10, color: "#0F172A", fontSize: 14 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  choiceGroup: { marginBottom: 14 },
  documentTypes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  documentTypeButton: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  documentTypeSelected: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  documentTypeText: { color: "#475569", fontSize: 12, fontWeight: "700" },
  documentTypeTextSelected: { color: "#9A3412" },
  uploadButton: { minHeight: 46, borderRadius: 9, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", marginTop: 14 },
  documentCard: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 9, padding: 12, marginTop: 10, backgroundColor: "#FFFFFF" },
  documentName: { color: "#0F172A", fontWeight: "700", fontSize: 13 },
  documentMeta: { color: "#64748B", fontSize: 11, marginTop: 5 },
  documentActions: { flexDirection: "row", gap: 18, marginTop: 12 },
  documentActionText: { color: "#C2410C", fontSize: 13, fontWeight: "800" },
  documentDeleteText: { color: "#B91C1C", fontSize: 13, fontWeight: "800" },
  emptyDocuments: { color: "#64748B", fontSize: 13, marginTop: 12 },
  hoursRow: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingVertical: 7 },
  timeFields: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 32, marginBottom: 8 },
  timeInput: { width: 86, minHeight: 38, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, backgroundColor: "#FFFFFF", paddingHorizontal: 8, color: "#0F172A", textAlign: "center" },
  timeSeparator: { color: "#64748B", fontSize: 12 },
  choiceButtons: { flexDirection: "row", gap: 10 },
  choiceButton: { minWidth: 86, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, paddingVertical: 10, alignItems: "center", backgroundColor: "#FFFFFF" },
  choiceButtonSelected: { backgroundColor: "#FFF7ED", borderColor: "#F97316" },
  choiceButtonText: { color: "#475569", fontWeight: "700" },
  choiceButtonTextSelected: { color: "#9A3412" },
  choiceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: "#94A3B8", borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  checkboxSelected: { backgroundColor: "#F97316", borderColor: "#F97316" },
  checkmark: { color: "#FFFFFF", fontWeight: "900" },
  choiceText: { color: "#334155", fontSize: 14, flex: 1 },
  notice: { color: "#9A3412", backgroundColor: "#FFF7ED", borderRadius: 9, padding: 12, marginBottom: 12, lineHeight: 19 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", borderRadius: 9, padding: 12, marginBottom: 14 },
  helper: { color: "#64748B", fontSize: 12, lineHeight: 18, marginTop: 18 },
  saveButton: { minHeight: 50, backgroundColor: "#F97316", borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 18 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  center: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { color: "#64748B", marginTop: 12 },
});
