import { router } from "expo-router";
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

import {
    createRestaurant,
    deleteRestaurant,
    getRestaurants,
    updateRestaurant,
    type Restaurant,
} from "@/services/adminService";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
  green: "#228B55",
  red: "#C83C3C",
};

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPhoneNumber("");
    setEmail("");
    setAddress("");
    setLatitude("");
    setLongitude("");
  };

  const saveRestaurant = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert("Missing information", "Name and address are required.");
      return;
    }

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateRestaurant(editingId, {
          name: name.trim(),
          description: description.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          latitude: Number(latitude) || 0,
          longitude: Number(longitude) || 0,
          isOpen: restaurants.find((r) => r.id === editingId)?.isOpen ?? true,
        });
      } else {
        await createRestaurant({
          name: name.trim(),
          description: description.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          latitude: Number(latitude) || 0,
          longitude: Number(longitude) || 0,
        });
      }

      resetForm();
      await loadRestaurants();

      Alert.alert(
        "Success",
        editingId !== null
          ? "Restaurant updated successfully."
          : "Restaurant created successfully.",
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to save restaurant.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);
    setName(restaurant.name);
    setDescription(restaurant.description ?? "");
    setPhoneNumber(restaurant.phoneNumber ?? "");
    setEmail(restaurant.email ?? "");
    setAddress(restaurant.address ?? "");
    setLatitude(String(restaurant.latitude ?? ""));
    setLongitude(String(restaurant.longitude ?? ""));
  };

  const removeRestaurant = (restaurant: Restaurant) => {
    Alert.alert(
      "Delete restaurant",
      `Are you sure you want to delete ${restaurant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRestaurant(restaurant.id);
              await loadRestaurants();
            } catch (error) {
              Alert.alert("Error", "Unable to delete restaurant.");
            }
          },
        },
      ],
    );
  };

  const toggleRestaurant = async (restaurant: Restaurant) => {
    try {
      await updateRestaurant(restaurant.id, {
        name: restaurant.name,
        description: restaurant.description,
        phoneNumber: restaurant.phoneNumber,
        email: restaurant.email,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        isOpen: !restaurant.isOpen,
      });

      await loadRestaurants();
    } catch (error) {
      Alert.alert("Error", "Unable to change restaurant status.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Admin</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Restaurants</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId !== null ? "Edit Restaurant" : "Add Restaurant"}
        </Text>

        <Input label="Name" value={name} onChangeText={setName} />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Input
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input label="Address" value={address} onChangeText={setAddress} />

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.half}>
            <Input
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={saveRestaurant}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {editingId !== null ? "Update Restaurant" : "Create Restaurant"}
            </Text>
          )}
        </Pressable>

        {editingId !== null && (
          <Pressable style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.cancelText}>Cancel Editing</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>Existing Restaurants</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
          style={{ marginTop: 20 }}
        />
      ) : restaurants.length === 0 ? (
        <Text style={styles.empty}>No restaurants found.</Text>
      ) : (
        restaurants.map((restaurant) => (
          <View style={styles.card} key={restaurant.id}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>

                <Text style={styles.description}>
                  {restaurant.description || "No description"}
                </Text>
              </View>

              <View
                style={[
                  styles.status,
                  restaurant.isOpen ? styles.open : styles.closed,
                ]}
              >
                <Text style={styles.statusText}>
                  {restaurant.isOpen ? "OPEN" : "CLOSED"}
                </Text>
              </View>
            </View>

            <Text style={styles.detail}>{restaurant.address}</Text>

            {restaurant.phoneNumber ? (
              <Text style={styles.detail}>📞 {restaurant.phoneNumber}</Text>
            ) : null}

            {restaurant.email ? (
              <Text style={styles.detail}>✉️ {restaurant.email}</Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => startEditing(restaurant)}
              >
                <Text style={styles.secondaryText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => toggleRestaurant(restaurant)}
              >
                <Text style={styles.secondaryText}>
                  {restaurant.isOpen ? "Close" : "Open"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => removeRestaurant(restaurant)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 20,
    paddingTop: 24,
  },

  back: {
    color: "#D9E6ED",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
  },

  form: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FAFBFC",
    color: COLORS.text,
  },

  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  half: {
    flex: 1,
  },

  primaryButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  cancelButton: {
    alignItems: "center",
    marginTop: 12,
  },

  cancelText: {
    color: COLORS.red,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  description: {
    color: COLORS.muted,
    marginTop: 5,
  },

  status: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },

  open: {
    backgroundColor: "#E7F6ED",
  },

  closed: {
    backgroundColor: "#FCEAEA",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  detail: {
    color: COLORS.muted,
    marginTop: 10,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  secondaryText: {
    color: COLORS.blue,
    fontWeight: "800",
  },

  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  deleteText: {
    color: COLORS.red,
    fontWeight: "800",
  },

  empty: {
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 20,
    marginBottom: 40,
  },
});