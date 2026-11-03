import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

import { useAuth } from "../context/authContext";
import {
  getRestaurantApplication,
  RestaurantApplicationDraft,
  saveRestaurantApplicationDraft,
  SaveRestaurantApplicationDraft,
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
};

export default function RestaurantApplicationEditScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { token, user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<RestaurantApplicationDraft | null>(null);
  const [form, setForm] = useState<DraftForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const update = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!token || !application) return;

    if (!form.tradingName.trim() || !form.physicalAddress.trim() || !form.city.trim()) {
      setError("Trading name, physical address and city are required before saving.");
      return;
    }

    if (
      !form.offersCustomerCollection &&
      !form.offersRestaurantDelivery &&
      !form.offersGrubnBiteDelivery
    ) {
      setError("Select at least one fulfilment method.");
      return;
    }

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
      operatingHours: application.operatingHours,
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
