import React, { useEffect, useState } from "react";
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
import { router } from "expo-router";

import {
  Address,
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../services/addressService";

const COLORS = {
  primary: "#1A4B6B",
  primaryDark: "#071B2C",
  secondary: "#2C7A9E",
  accent: "#F4C542",
  background: "#F7F9FB",
  white: "#FFFFFF",
  text: "#17212B",
  muted: "#6B7785",
  border: "#DDE4EA",
  danger: "#C0392B",
  success: "#2E7D32",
};

type FormData = {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
};

const emptyForm: FormData = {
  label: "",
  streetAddress: "",
  city: "",
  province: "",
  postalCode: "",
};

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Failed to load addresses:", error);

      Alert.alert(
        "Unable to load addresses",
        "We could not load your saved addresses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAddForm = () => {
    setEditingAddress(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (address: Address) => {
    setEditingAddress(address);

    setForm({
      label: address.label,
      streetAddress: address.streetAddress,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingAddress(null);
    setForm(emptyForm);
  };

  const updateField = (
    field: keyof FormData,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.label.trim()) {
      Alert.alert("Missing information", "Please enter an address label.");
      return false;
    }

    if (!form.streetAddress.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your street address.",
      );
      return false;
    }

    if (!form.city.trim()) {
      Alert.alert("Missing information", "Please enter your city.");
      return false;
    }

    if (!form.province.trim()) {
      Alert.alert("Missing information", "Please enter your province.");
      return false;
    }

    if (!form.postalCode.trim()) {
      Alert.alert("Missing information", "Please enter your postal code.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingAddress) {
        await updateAddress(editingAddress.id, {
          label: form.label.trim(),
          streetAddress: form.streetAddress.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
        });
      } else {
        await createAddress({
          label: form.label.trim(),
          streetAddress: form.streetAddress.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          postalCode: form.postalCode.trim(),
          latitude: null,
          longitude: null,
          isDefault: addresses.length === 0,
        });
      }

      closeForm();
      await loadAddresses();
    } catch (error) {
      console.error("Failed to save address:", error);

      Alert.alert(
        "Could not save address",
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the address.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Delete address",
      `Are you sure you want to delete "${address.label}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              await loadAddresses();
            } catch (error) {
              console.error("Failed to delete address:", error);

              Alert.alert(
                "Could not delete address",
                error instanceof Error
                  ? error.message
                  : "Something went wrong while deleting the address.",
              );
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) {
      return;
    }

    try {
      await setDefaultAddress(address.id);
      await loadAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);

      Alert.alert(
        "Could not update address",
        error instanceof Error
          ? error.message
          : "Something went wrong while setting the default address.",
      );
    }
  };

  const renderAddressCard = (address: Address) => {
    return (
      <View key={address.id} style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleRow}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>⌖</Text>
            </View>

            <View style={styles.addressTitleContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.addressLabel}>
                  {address.label}
                </Text>

                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>
                      DEFAULT
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.addressDetails}>
          <Text style={styles.addressText}>
            {address.streetAddress}
          </Text>

          <Text style={styles.addressText}>
            {address.city}, {address.province}
          </Text>

          <Text style={styles.addressText}>
            {address.postalCode}
          </Text>
        </View>

        <View style={styles.cardActions}>
          {!address.isDefault && (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetDefault(address)}
            >
              <Text style={styles.actionButtonText}>
                Set as default
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.actionButton}
            onPress={() => openEditForm(address)}
          >
            <Text style={styles.actionButtonText}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(address)}
          >
            <Text style={styles.deleteButtonText}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>
            Delivery Addresses
          </Text>
          <Text style={styles.headerSubtitle}>
            Manage where you want your food delivered
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!showForm && (
          <>
            <Pressable
              style={styles.addButton}
              onPress={openAddForm}
            >
              <Text style={styles.addButtonPlus}>+</Text>
              <View>
                <Text style={styles.addButtonTitle}>
                  Add new address
                </Text>
                <Text style={styles.addButtonSubtitle}>
                  Add a delivery location
                </Text>
              </View>
            </Pressable>

            <Text style={styles.sectionTitle}>
              Saved addresses
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                />
                <Text style={styles.loadingText}>
                  Loading addresses...
                </Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⌂</Text>

                <Text style={styles.emptyTitle}>
                  No saved addresses
                </Text>

                <Text style={styles.emptyText}>
                  Add a delivery address so you can check out
                  faster.
                </Text>

                <Pressable
                  style={styles.emptyButton}
                  onPress={openAddForm}
                >
                  <Text style={styles.emptyButtonText}>
                    Add an address
                  </Text>
                </Pressable>
              </View>
            ) : (
              addresses.map(renderAddressCard)
            )}
          </>
        )}

        {showForm && (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>
                  {editingAddress
                    ? "Edit address"
                    : "Add new address"}
                </Text>

                <Text style={styles.formSubtitle}>
                  Enter your delivery details below
                </Text>
              </View>

              <Pressable
                onPress={closeForm}
                disabled={saving}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>
              Address label
            </Text>

            <TextInput
              value={form.label}
              onChangeText={(value) =>
                updateField("label", value)
              }
              placeholder="e.g. Home, Work, Residence"
              placeholderTextColor="#9AA5AF"
              style={styles.input}
              editable={!saving}
            />

            <Text style={styles.inputLabel}>
              Street address
            </Text>

            <TextInput
              value={form.streetAddress}
              onChangeText={(value) =>
                updateField("streetAddress", value)
              }
              placeholder="e.g. 12 Main Street"
              placeholderTextColor="#9AA5AF"
              style={styles.input}
              editable={!saving}
            />

            <Text style={styles.inputLabel}>
              City
            </Text>

            <TextInput
              value={form.city}
              onChangeText={(value) =>
                updateField("city", value)
              }
              placeholder="e.g. Gqeberha"
              placeholderTextColor="#9AA5AF"
              style={styles.input}
              editable={!saving}
            />

            <Text style={styles.inputLabel}>
              Province
            </Text>

            <TextInput
              value={form.province}
              onChangeText={(value) =>
                updateField("province", value)
              }
              placeholder="e.g. Eastern Cape"
              placeholderTextColor="#9AA5AF"
              style={styles.input}
              editable={!saving}
            />

            <Text style={styles.inputLabel}>
              Postal code
            </Text>

            <TextInput
              value={form.postalCode}
              onChangeText={(value) =>
                updateField("postalCode", value)
              }
              placeholder="e.g. 6001"
              placeholderTextColor="#9AA5AF"
              style={styles.input}
              keyboardType="number-pad"
              editable={!saving}
            />

            {!editingAddress && (
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ⓘ</Text>

                <Text style={styles.infoText}>
                  If this is your first address, it will
                  automatically be saved as your default
                  delivery address.
                </Text>
              </View>
            )}

            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeForm}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color={COLORS.white}
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingAddress
                      ? "Save changes"
                      : "Add address"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF3F7",
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 34,
    lineHeight: 36,
    color: COLORS.primaryDark,
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },

  content: {
    padding: 20,
    paddingBottom: 50,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },

  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  addButtonPlus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    color: COLORS.white,
    fontSize: 28,
    textAlign: "center",
    lineHeight: 40,
    marginRight: 14,
  },

  addButtonTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  addButtonSubtitle: {
    color: "#D9E8F2",
    fontSize: 13,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 14,
  },

  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  addressHeader: {
    marginBottom: 14,
  },

  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  locationIconText: {
    fontSize: 22,
    color: COLORS.primary,
  },

  addressTitleContainer: {
    flex: 1,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  addressLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  defaultBadge: {
    backgroundColor: "#E7F4E8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  defaultBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: "800",
  },

  addressDetails: {
    paddingLeft: 54,
    marginBottom: 16,
  },

  addressText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },

  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  actionButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  actionButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#E5B7B3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },

  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    fontSize: 42,
    color: COLORS.primary,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 420,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },

  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  formTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  formSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  closeText: {
    fontSize: 20,
    color: COLORS.muted,
    padding: 4,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 7,
    marginTop: 13,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FCFDFE",
  },

  infoBox: {
    marginTop: 18,
    padding: 13,
    backgroundColor: "#F0F6FA",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIcon: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
  },

  infoText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 12,
    lineHeight: 18,
  },

  formActions: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  cancelButtonText: {
    color: COLORS.text,
    fontWeight: "700",
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    minWidth: 130,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.65,
  },
});
