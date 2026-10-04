import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import CustomerBottomNav from "../components/CustomerBottomNav";
import {
    Address,
    createAddress,
    deleteAddress,
    getAddresses,
    setDefaultAddress,
} from "../services/addressService";

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const result = await getAddresses();

      setAddresses(result);
    } catch (error) {
      console.error("LOAD ADDRESSES ERROR:", error);

      Alert.alert(
        "Unable to load addresses",
        "We could not load your saved addresses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, []),
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const result = await getAddresses();

      setAddresses(result);
    } catch (error) {
      console.error("REFRESH ADDRESSES ERROR:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setLabel("");
    setStreetAddress("");
    setCity("");
    setProvince("");
    setPostalCode("");
  };

  const handleCreateAddress = async () => {
    console.log("========== HANDLE CREATE ADDRESS ==========");
    if (
      !streetAddress.trim() ||
      !city.trim() ||
      !province.trim() ||
      !postalCode.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please complete the required address fields.",
      );
      return;
    }

    try {
      setSaving(true);

      const newAddress = await createAddress({
        label: label.trim(),
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        latitude: 0,
        longitude: 0,
        isDefault: addresses.length === 0,
      });

      setAddresses((current) => [...current, newAddress]);

      resetForm();
      setModalVisible(false);

      Alert.alert("Address saved", "Your delivery address has been saved.");
    } catch (error) {
      console.error("CREATE ADDRESS ERROR:", error);

      Alert.alert(
        "Unable to save",
        "We could not save your address. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Delete address",
      `Are you sure you want to delete ${address.label || "this address"}?`,
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
              await deleteAddress(address.addressId);

              setAddresses((current) =>
                current.filter((item) => item.addressId !== address.addressId),
              );
            } catch (error) {
              console.error("DELETE ADDRESS ERROR:", error);

              Alert.alert(
                "Unable to delete",
                "We could not delete this address.",
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
      await setDefaultAddress(address.addressId);

      setAddresses((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item.addressId === address.addressId,
        })),
      );
    } catch (error) {
      console.error("SET DEFAULT ERROR:", error);

      Alert.alert(
        "Unable to update",
        "We could not change your default address.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>‹</Text>
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Addresses</Text>

            <Text style={styles.headerSubtitle}>
              Manage your delivery locations
            </Text>
          </View>
        </View>

        {/* Add Address */}
        <Pressable
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add New Address</Text>
        </Pressable>

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />

            <Text style={styles.loadingText}>Loading your addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>

            <Text style={styles.emptyTitle}>No saved addresses</Text>

            <Text style={styles.emptySubtitle}>
              Add a delivery address so you can order your favourite meals
              faster.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <View
                key={address.addressId}
                style={[
                  styles.addressCard,
                  address.isDefault && styles.defaultCard,
                ]}
              >
                <View style={styles.addressHeader}>
                  <View style={styles.addressTitleContainer}>
                    <Text style={styles.addressLabel}>
                      {address.label || "Delivery Address"}
                    </Text>

                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.addressText}>{address.streetAddress}</Text>

                <Text style={styles.addressText}>
                  {address.city}, {address.province}
                </Text>

                <Text style={styles.addressText}>{address.postalCode}</Text>

                <View style={styles.actions}>
                  {!address.isDefault && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address)}
                    >
                      <Text style={styles.actionText}>Set Default</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDelete(address)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CustomerBottomNav />

      {/* Add Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Address</Text>

                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                Save a delivery address for your future orders.
              </Text>

              {/* Label */}
              <Text style={styles.label}>Address Label</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Home, Work"
                placeholderTextColor="#94A3B8"
                value={label}
                onChangeText={setLabel}
              />

              {/* Street */}
              <Text style={styles.label}>Street Address *</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. 12 Main Street"
                placeholderTextColor="#94A3B8"
                value={streetAddress}
                onChangeText={setStreetAddress}
              />

              {/* City */}
              <Text style={styles.label}>City *</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Gqeberha"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={setCity}
              />

              {/* Province */}
              <Text style={styles.label}>Province *</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Eastern Cape"
                placeholderTextColor="#94A3B8"
                value={province}
                onChangeText={setProvince}
              />

              {/* Postal Code */}
              <Text style={styles.label}>Postal Code *</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. 6001"
                placeholderTextColor="#94A3B8"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={() => {
                  console.log("========== SAVE BUTTON PRESSED ==========");
                  console.log("saving:", saving);
                  console.log("street:", streetAddress);
                  console.log("city:", city);
                  console.log("province:", province);
                  console.log("postal:", postalCode);

                  handleCreateAddress();
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Address</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingBottom: 120,
  },

  header: {
    backgroundColor: "#071B2C",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 40,
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 4,
  },

  addButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  loadingContainer: {
    alignItems: "center",
    paddingTop: 70,
  },

  loadingText: {
    color: "#64748B",
    marginTop: 12,
    fontSize: 14,
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 70,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },

  emptyTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "800",
  },

  emptySubtitle: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  emptyButton: {
    backgroundColor: "#071B2C",
    borderRadius: 11,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 22,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  addressList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 14,
  },

  defaultCard: {
    borderColor: "#F97316",
  },

  addressHeader: {
    marginBottom: 12,
  },

  addressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressLabel: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "800",
  },

  defaultBadge: {
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },

  defaultBadgeText: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
  },

  addressText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
  },

  actions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },

  actionButton: {
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  actionText: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "700",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  deleteText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 24,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    color: "#172033",
    fontSize: 23,
    fontWeight: "800",
  },

  closeButton: {
    color: "#64748B",
    fontSize: 32,
    lineHeight: 32,
  },

  modalSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 22,
  },

  label: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#172033",
    backgroundColor: "#F8FAFC",
  },

  saveButton: {
    height: 50,
    backgroundColor: "#F97316",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 15,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
