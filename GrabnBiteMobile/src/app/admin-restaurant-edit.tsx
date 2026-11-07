import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { apiRequest } from "../services/api";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";

interface Restaurant {
  restaurantId: number;
  name: string;
  description?: string;
  phoneNumber: string;
  email: string;
  address: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminRestaurantEditScreen() {
  const { user, token } = useAuth();
  const { showError } = useErrorFeedback();
  const { restaurantId } = useLocalSearchParams<{
    restaurantId: string;
  }>();

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

  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [saving, setSaving] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalConfirmation, setApprovalConfirmation] = useState<boolean | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [error, setError] = useState(restaurantId ? "" : "Restaurant ID is missing.");

  const loadRestaurant = useCallback(async () => {
    try {
      const data = await apiRequest(
        `/api/Restaurant/${restaurantId}`,
        {},
        token,
      );

      setError("");
      setRestaurant(data);

      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setPhoneNumber(data.phoneNumber ?? "");
      setEmail(data.email ?? "");
      setAddress(data.address ?? "");
      setImageUrl(data.imageUrl ?? "");
      setLatitude(
        data.latitude !== null && data.latitude !== undefined
          ? String(data.latitude)
          : "",
      );
      setLongitude(
        data.longitude !== null && data.longitude !== undefined
          ? String(data.longitude)
          : "",
      );
      setIsOpen(data.isOpen ?? false);
    } catch (err) {
      logAppError("Loading restaurant details for administration", err);
      setError("Unable to load restaurant details.");
      showError(getUserFacingError(err, {
        title: "We couldn't load this restaurant",
        message: "The restaurant details are temporarily unavailable. Please try again.",
      }), () => { void loadRestaurant(); });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, token, showError]);

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
    if (restaurantId) void loadRestaurant();
  }, [user, restaurantId, loadRestaurant]);

  async function updateApproval(isApproved: boolean) {
    if (!restaurantId || !restaurant) return;

    try {
      setApprovalLoading(true);
      setApprovalError("");
      setApprovalMessage("");

      const updatedRestaurant = await apiRequest(
        "/api/Restaurant/admin/" + restaurantId + "/approval",
        {
          method: "PUT",
          body: JSON.stringify({ isApproved }),
        },
        token,
      );

      setRestaurant(updatedRestaurant);
      setApprovalConfirmation(null);
      setApprovalMessage(
        isApproved
          ? "Restaurant approved successfully. It can now appear to customers."
          : "Approval removed. The restaurant is now hidden from customers.",
      );
    } catch (err) {
      logAppError("Updating restaurant approval", err);
      showError(getUserFacingError(err, {
        title: "We couldn't update restaurant approval",
        message: "The restaurant's approval status has not been changed. Please try again.",
      }), () => { void updateApproval(isApproved); });
    } finally {
      setApprovalLoading(false);
    }
  }

  async function saveRestaurant() {
    if (!name.trim()) {
      Alert.alert("Missing information", "Restaurant name is required.");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Missing information", "Phone number is required.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing information", "Email is required.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Missing information", "Address is required.");
      return;
    }

    const latitudeValue = latitude.trim() === "" ? null : Number(latitude);

    const longitudeValue = longitude.trim() === "" ? null : Number(longitude);

    if (latitude.trim() !== "" && Number.isNaN(latitudeValue)) {
      Alert.alert("Invalid latitude", "Please enter a valid latitude.");
      return;
    }

    if (longitude.trim() !== "" && Number.isNaN(longitudeValue)) {
      Alert.alert("Invalid longitude", "Please enter a valid longitude.");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(
        `/api/Restaurant/admin/${restaurantId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim(),
            address: address.trim(),
            imageUrl: imageUrl.trim(),
            latitude: latitudeValue,
            longitude: longitudeValue,
            isOpen,
          }),
        },
        token,
      );

      Alert.alert("Saved", "Restaurant details have been updated.", [
        {
          text: "OK",
          onPress: () => router.replace("/admin-restaurants"),
        },
      ]);
    } catch (err) {
      logAppError("Saving restaurant details in admin", err);
      showError(getUserFacingError(err, {
        title: "We couldn't save this restaurant",
        message: "The restaurant details have not been updated. Please check the information and try again.",
      }), () => { void saveRestaurant(); });
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "Admin") {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#F97316" />

        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error !== "") {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Unable to load restaurant</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadRestaurant}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>

        <Pressable
          style={styles.backSecondaryButton}
          onPress={() => router.replace("/admin-restaurants")}
        >
          <Text style={styles.backSecondaryText}>Back to Restaurants</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/admin-restaurants")}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Edit Restaurant</Text>

          <Text style={styles.headerSubtitle}>Manage restaurant details</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* RESTAURANT SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{name || "Restaurant"}</Text>

            <Text style={styles.summaryId}>
              Restaurant ID: {restaurant?.restaurantId}
            </Text>
          </View>

          <View
            style={[
              styles.approvalBadge,
              restaurant?.isApproved
                ? styles.approvedBadge
                : styles.pendingBadge,
            ]}
          >
            <Text
              style={[
                styles.approvalText,
                restaurant?.isApproved
                  ? styles.approvedText
                  : styles.pendingText,
              ]}
            >
              {restaurant?.isApproved ? "Approved" : "Pending"}
            </Text>
          </View>
        </View>

        {/* BASIC DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Details</Text>

          <Text style={styles.label}>Restaurant Name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Restaurant name"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Description</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Restaurant description"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Address</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Restaurant address"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* IMAGE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Image</Text>

          <Text style={styles.label}>Image URL</Text>

          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* LOCATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>Latitude</Text>

          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="-33.9608"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Longitude</Text>

          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="25.6022"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
        </View>

        {/* RESTAURANT STATUS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Status</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Restaurant is open</Text>

              <Text style={styles.statusDescription}>
                Controls whether the restaurant is currently open for orders.
              </Text>
            </View>

            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{
                false: "#CBD5E1",
                true: "#FDBA74",
              }}
              thumbColor={isOpen ? "#F97316" : "#F8FAFC"}
            />
          </View>
        </View>

        {/* APPROVAL */}
        <View style={styles.approvalInfoCard}>
          <Text style={styles.approvalInfoTitle}>Approval Status</Text>

          <Text style={styles.approvalInfoText}>
            {restaurant?.isApproved
              ? "This restaurant has been approved."
              : "This restaurant is still awaiting admin approval."}
          </Text>

          <Text style={styles.approvalInfoNote}>
            Approval is managed separately from restaurant details.
          </Text>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: restaurant?.isApproved === true ? "#B91C1C" : "#15803D" },
            (approvalLoading || saving) && styles.saveButtonDisabled,
          ]}
          onPress={() => {
            setApprovalError("");
            setApprovalMessage("");
            setApprovalConfirmation(restaurant?.isApproved !== true);
          }}
          disabled={approvalLoading || saving || !restaurant}
          accessibilityRole="button"
        >
          {approvalLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {restaurant?.isApproved === true ? "Remove Approval" : "Approve Restaurant"}
            </Text>
          )}
        </Pressable>

        {approvalConfirmation !== null && (
          <View style={styles.approvalConfirmCard}>
            <Text style={styles.approvalConfirmText}>
              {approvalConfirmation
                ? "Approve this restaurant? It will become visible to customers."
                : "Remove this restaurant's approval? It will be hidden from customers."}
            </Text>
            <Pressable
              style={styles.approvalConfirmButton}
              onPress={() => void updateApproval(approvalConfirmation)}
              disabled={approvalLoading}
            >
              <Text style={styles.saveButtonText}>
                {approvalConfirmation ? "Confirm Approval" : "Confirm Removal"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setApprovalConfirmation(null)}
              disabled={approvalLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {approvalMessage !== "" && (
          <Text style={styles.approvalSuccessText}>{approvalMessage}</Text>
        )}
        {approvalError !== "" && (
          <Text style={styles.approvalErrorText}>{approvalError}</Text>
        )}

        {/* SAVE */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveRestaurant}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.replace("/admin-restaurants")}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Created:{" "}
            {restaurant?.createdAt
              ? new Date(restaurant.createdAt).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#12324A",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 4,
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#071B2C",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },

  summaryName: {
    color: "#071B2C",
    fontSize: 17,
    fontWeight: "800",
  },

  summaryId: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  approvalBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  approvedBadge: {
    backgroundColor: "#DCFCE7",
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  approvalText: {
    fontSize: 11,
    fontWeight: "700",
  },

  approvedText: {
    color: "#166534",
  },

  pendingText: {
    color: "#92400E",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginTop: 16,
  },

  sectionTitle: {
    color: "#071B2C",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 18,
  },

  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#071B2C",
  },

  textArea: {
    height: 90,
    paddingTop: 12,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  statusInfo: {
    flex: 1,
  },

  statusTitle: {
    color: "#071B2C",
    fontSize: 15,
    fontWeight: "700",
  },

  statusDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  approvalInfoCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 18,
    marginTop: 16,
  },

  approvalInfoTitle: {
    color: "#9A3412",
    fontSize: 15,
    fontWeight: "800",
  },

  approvalInfoText: {
    color: "#7C2D12",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  approvalInfoNote: {
    color: "#9A3412",
    fontSize: 12,
    marginTop: 8,
  },

  approvalConfirmCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },

  approvalConfirmText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  approvalConfirmButton: {
    height: 46,
    borderRadius: 9,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
  },

  approvalSuccessText: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderRadius: 9,
    padding: 12,
    marginTop: 12,
    lineHeight: 19,
  },

  approvalErrorText: {
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
    borderRadius: 9,
    padding: 12,
    marginTop: 12,
    lineHeight: 19,
  },

  saveButton: {
    backgroundColor: "#F97316",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  cancelButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },

  metadata: {
    alignItems: "center",
    marginTop: 20,
  },

  metadataText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  errorScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  errorTitle: {
    color: "#071B2C",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  errorText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  backSecondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 10,
  },

  backSecondaryText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
});
