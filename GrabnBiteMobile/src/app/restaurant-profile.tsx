import { router } from "expo-router";
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

import { useAuth } from "../context/authContext";
import {
  createRestaurant,
  getMyRestaurant,
} from "../services/restaurantService";
import { Restaurant } from "../types/restaurant";

export default function RestaurantProfileScreen() {
  const { user, token, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [existingRestaurant, setExistingRestaurant] = useState<Restaurant | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const checkExistingProfile = useCallback(async () => {
    if (!token || user?.role !== "Restaurant") return;

    try {
      const restaurant = await getMyRestaurant(token);
      setExistingRestaurant(restaurant);
      setError("");
    } catch (err: any) {
      // A 404 means this restaurant account has not created a profile yet.
      if (!String(err?.message ?? "").includes("HTTP 404")) {
        setError(err?.message || "Unable to check your restaurant profile.");
      }
    } finally {
      setCheckingProfile(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (!authLoading && user?.role !== "Restaurant") {
      router.replace("/");
      return;
    }

    if (!authLoading && token && user?.role === "Restaurant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the profile after authentication is ready.
      void checkExistingProfile();
    }
  }, [authLoading, token, user?.role, checkExistingProfile]);

  async function handleSubmit() {
    if (!token) return;

    if (!name.trim() || !phoneNumber.trim() || !email.trim() || !address.trim()) {
      Alert.alert(
        "Missing information",
        "Restaurant name, phone number, email and address are required.",
      );
      return;
    }

    const latitudeValue = latitude.trim() ? Number(latitude) : 0;
    const longitudeValue = longitude.trim() ? Number(longitude) : 0;

    if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue)) {
      Alert.alert("Invalid location", "Enter valid numeric latitude and longitude values.");
      return;
    }

    if (latitudeValue < -90 || latitudeValue > 90) {
      Alert.alert("Invalid latitude", "Latitude must be between -90 and 90.");
      return;
    }

    if (longitudeValue < -180 || longitudeValue > 180) {
      Alert.alert("Invalid longitude", "Longitude must be between -180 and 180.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const created = await createRestaurant(
        {
          name: name.trim(),
          description: description.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          imageUrl: imageUrl.trim() || null,
          latitude: latitudeValue,
          longitude: longitudeValue,
        },
        token,
      );

      setExistingRestaurant(created);
      Alert.alert(
        "Profile submitted",
        "Your restaurant profile has been created and is awaiting administrator approval.",
        [{ text: "Continue", onPress: () => router.replace("/restaurant-dashboard") }],
      );
    } catch (err: any) {
      setError(err?.message || "Unable to create your restaurant profile.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || checkingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.muted}>Checking your restaurant profile...</Text>
      </View>
    );
  }

  if (!token || user?.role !== "Restaurant") return null;

  if (existingRestaurant) {
    return (
      <View style={styles.center}>
        <View style={styles.statusCard}>
          <Text style={styles.title}>{existingRestaurant.name}</Text>
          <Text style={styles.status}>
            {existingRestaurant.isApproved ? "Approved" : "Awaiting approval"}
          </Text>
          <Text style={styles.muted}>
            {existingRestaurant.isApproved
              ? "Your restaurant profile is approved."
              : "Your profile has been submitted. An administrator must approve it before customers can see your restaurant."}
          </Text>
          <Pressable
            style={[styles.primaryButton, { marginTop: 18 }]}
            onPress={() => router.push("/restaurant-profile-edit")}
          >
            <Text style={styles.primaryButtonText}>Edit restaurant profile</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { marginTop: 10 }]}
            onPress={() => router.replace("/restaurant-dashboard")}
          >
            <Text style={styles.secondaryButtonText}>Back to dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/restaurant-dashboard")}>
          <Text style={styles.backText}>‹  Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create restaurant profile</Text>
        <Text style={styles.headerSubtitle}>Enter the details customers will use to identify and contact your restaurant.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Field label="Restaurant name *" value={name} onChangeText={setName} placeholder="e.g. The Food Spot" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Tell customers what you serve" multiline />
        <Field label="Contact phone *" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Restaurant phone number" keyboardType="phone-pad" />
        <Field label="Contact email *" value={email} onChangeText={setEmail} placeholder="Restaurant email" keyboardType="email-address" />
        <Field label="Physical address *" value={address} onChangeText={setAddress} placeholder="Street address and area" multiline />
        <Field label="Image URL (optional)" value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." autoCapitalize="none" />
        <Text style={styles.locationNote}>Location coordinates are optional. Leave them blank if you do not have them yet.</Text>
        <Field label="Latitude" value={latitude} onChangeText={setLatitude} placeholder="-33.9608" keyboardType="numeric" />
        <Field label="Longitude" value={longitude} onChangeText={setLongitude} placeholder="25.6022" keyboardType="numeric" />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Approval required</Text>
          <Text style={styles.noticeText}>Your restaurant will remain hidden from customers until an administrator approves this profile.</Text>
        </View>

        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Submit restaurant profile</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#071B2C", paddingHorizontal: 22, paddingTop: 54, paddingBottom: 24 },
  backText: { color: "#FDBA74", fontSize: 14, fontWeight: "700", marginBottom: 18 },
  headerTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "800" },
  headerSubtitle: { color: "#CBD5E1", fontSize: 14, lineHeight: 20, marginTop: 7 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, paddingBottom: 50 },
  field: { marginBottom: 15 },
  label: { color: "#071B2C", fontSize: 14, fontWeight: "700", marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, backgroundColor: "#FFFFFF", paddingHorizontal: 14, color: "#071B2C", fontSize: 15 },
  multiline: { minHeight: 88, paddingTop: 12 },
  locationNote: { color: "#64748B", fontSize: 13, lineHeight: 19, marginTop: 2, marginBottom: 8 },
  notice: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 5, marginBottom: 20 },
  noticeTitle: { color: "#9A3412", fontWeight: "800", fontSize: 15 },
  noticeText: { color: "#7C2D12", fontSize: 13, lineHeight: 19, marginTop: 5 },
  primaryButton: { backgroundColor: "#F97316", minHeight: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 13 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  secondaryButton: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  secondaryButtonText: { color: "#334155", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", borderRadius: 9, padding: 12, marginBottom: 15 },
  center: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { color: "#64748B", textAlign: "center", lineHeight: 20, marginTop: 12 },
  statusCard: { width: "100%", maxWidth: 480, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center" },
  title: { color: "#071B2C", fontSize: 23, fontWeight: "800", textAlign: "center" },
  status: { color: "#9A3412", fontWeight: "800", fontSize: 16, marginTop: 12 },
});
