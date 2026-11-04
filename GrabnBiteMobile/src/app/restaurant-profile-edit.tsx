import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import {
  deleteRestaurantImage,
  getMyRestaurant,
  updateMyRestaurant,
  uploadRestaurantImage,
} from "../services/restaurantService";
import { Restaurant } from "../types/restaurant";

export default function RestaurantProfileEditScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [imageUploadMessage, setImageUploadMessage] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMyRestaurant(token);
      setRestaurant(data);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setPhoneNumber(data.phoneNumber ?? "");
      setEmail(data.email ?? "");
      setAddress(data.address ?? "");
      setImageUrl(data.imageUrl ?? "");
      setLatitude(
        data.latitude === null || data.latitude === undefined
          ? ""
          : String(data.latitude),
      );
      setLongitude(
        data.longitude === null || data.longitude === undefined
          ? ""
          : String(data.longitude),
      );
      setIsOpen(data.isOpen);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Unable to load your restaurant profile.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && user?.role !== "Restaurant") {
      router.replace("/");
      return;
    }
    if (!authLoading && token && user?.role === "Restaurant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the authenticated restaurant profile.
      void loadProfile();
    }
  }, [authLoading, token, user?.role, loadProfile]);

  async function chooseRestaurantImage() {
    if (!token || !restaurant) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to choose a restaurant cover image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    try {
      setImageUploadMessage("");
      setImageUploadError("");
      setUploadingImage(true);
      const updated = await uploadRestaurantImage(
        restaurant.restaurantId,
        {
          uri: asset.uri,
          name: asset.fileName ?? `restaurant-${restaurant.restaurantId}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        },
        token,
      );
      setRestaurant(updated);
      setImageUrl(updated.imageUrl ?? "");
      setImageUploadMessage("Restaurant cover image uploaded successfully.");
    } catch (err: any) {
      setImageUploadError(
        err?.message || "Unable to upload the restaurant cover image.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeRestaurantImage() {
    if (!token || !restaurant || !imageUrl) return;

    Alert.alert(
      "Remove cover image",
      "Are you sure you want to remove this cover image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setUploadingImage(true);
              const updated = await deleteRestaurantImage(
                restaurant.restaurantId,
                token,
              );
              setRestaurant(updated);
              setImageUrl("");
            } catch (err: any) {
              Alert.alert(
                "Unable to remove cover image",
                err?.message || "Please try again.",
              );
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ],
    );
  }

  async function saveProfile() {
    if (!token || !restaurant) return;

    if (
      !name.trim() ||
      !phoneNumber.trim() ||
      !email.trim() ||
      !address.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Name, phone number, email and address are required.",
      );
      return;
    }

    const latitudeValue = latitude.trim() ? Number(latitude) : 0;
    const longitudeValue = longitude.trim() ? Number(longitude) : 0;

    if (
      !Number.isFinite(latitudeValue) ||
      latitudeValue < -90 ||
      latitudeValue > 90
    ) {
      Alert.alert(
        "Invalid latitude",
        "Latitude must be a number between -90 and 90.",
      );
      return;
    }
    if (
      !Number.isFinite(longitudeValue) ||
      longitudeValue < -180 ||
      longitudeValue > 180
    ) {
      Alert.alert(
        "Invalid longitude",
        "Longitude must be a number between -180 and 180.",
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMyRestaurant(
        restaurant.restaurantId,
        {
          name: name.trim(),
          description: description.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          imageUrl: restaurant.imageUrl,
          latitude: latitudeValue,
          longitude: longitudeValue,
          isOpen,
        },
        token,
      );
      setRestaurant(updated);
      Alert.alert(
        "Profile updated",
        "Your restaurant details have been saved.",
        [{ text: "OK", onPress: () => router.replace("/restaurant-profile") }],
      );
    } catch (err: any) {
      Alert.alert(
        "Update failed",
        err?.message || "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.muted}>Loading profile...</Text>
      </View>
    );
  }
  if (!token || user?.role !== "Restaurant") return null;
  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error || "Restaurant profile not found."}
        </Text>
        <Pressable style={styles.button} onPress={loadProfile}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.heading}>Edit restaurant profile</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Restaurant name *" value={name} onChangeText={setName} />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label="Phone number *"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Field
          label="Email *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Field
          label="Address *"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <View style={styles.imageSection}>
          <Text style={styles.label}>Restaurant cover image</Text>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                No cover image selected
              </Text>
            </View>
          )}
          <Pressable
            style={[styles.button, uploadingImage && styles.disabled]}
            onPress={chooseRestaurantImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {imageUrl
                  ? "Change cover image"
                  : "Choose cover image"}
              </Text>
            )}
          </Pressable>
          {imageUrl ? (
            <Pressable
              style={styles.removeImageButton}
              onPress={removeRestaurantImage}
              disabled={uploadingImage}
            >
              <Text style={styles.removeImageText}>Remove cover image</Text>
            </Pressable>
          ) : null}
          {imageUploadMessage ? (
            <Text style={styles.imageSuccess}>{imageUploadMessage}</Text>
          ) : null}
          {imageUploadError ? (
            <Text style={styles.imageError}>{imageUploadError}</Text>
          ) : null}
          <Text style={styles.helper}>
            Displayed to customers as your restaurant cover image. JPEG, PNG or WebP; maximum file size: 5 MB.
          </Text>
        </View>
        <Field
          label="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
        />
        <Field
          label="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
        />
        <View style={styles.openRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Accepting orders (open)</Text>
            <Text style={styles.helper}>
              This changes the restaurant&apos;s open/closed status, not its
              approval.
            </Text>
          </View>
          <Switch value={isOpen} onValueChange={setIsOpen} />
        </View>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {restaurant.isApproved
              ? "Your restaurant is approved."
              : "Your restaurant is awaiting administrator approval. Editing details does not approve it."}
          </Text>
        </View>
        <Pressable
          style={[styles.button, (saving || uploadingImage) && styles.disabled]}
          onPress={saveProfile}
          disabled={saving || uploadingImage}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save profile changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label.replace(" *", "")}
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
  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 24,
  },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 16 },
  heading: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },
  field: { marginBottom: 15 },
  label: { color: "#071B2C", fontSize: 14, fontWeight: "700", marginBottom: 7 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#071B2C",
    fontSize: 15,
  },
  multiline: { minHeight: 86, paddingTop: 12 },
  helper: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  imageSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
  },
  restaurantImage: {
    width: "100%",
    height: 180,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  imagePlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: "#64748B", fontSize: 13 },
  removeImageButton: { alignItems: "center", paddingVertical: 12 },
  removeImageText: { color: "#B91C1C", fontWeight: "700" },
  imageSuccess: { color: "#166534", fontSize: 13, marginTop: 8 },
  imageError: { color: "#B91C1C", fontSize: 13, lineHeight: 18, marginTop: 8 },
  openRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  notice: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginVertical: 14,
  },
  noticeText: { color: "#9A3412", fontSize: 13, lineHeight: 19 },
  button: {
    backgroundColor: "#F97316",
    minHeight: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  muted: { color: "#64748B", marginTop: 12 },
  error: { color: "#B91C1C", textAlign: "center", marginBottom: 16 },
});
