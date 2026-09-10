import React, { useState } from "react";
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
import { useRouter } from "expo-router";

import { createDriver } from "@/services/driverService";

export default function DriverRegistrationScreen() {
  const router = useRouter();

  const [vehicleType, setVehicleType] = useState("");
  const [vehicleRegistration, setVehicleRegistration] =
    useState("");

  const [saving, setSaving] = useState(false);

  const register = async () => {
    if (!vehicleType.trim()) {
      Alert.alert(
        "Vehicle type required",
        "Please enter your vehicle type.",
      );
      return;
    }

    if (!vehicleRegistration.trim()) {
      Alert.alert(
        "Registration required",
        "Please enter your vehicle registration.",
      );
      return;
    }

    try {
      setSaving(true);

      await createDriver({
        vehicleType: vehicleType.trim(),
        vehicleRegistration:
          vehicleRegistration.trim(),
      });

      Alert.alert(
        "Application submitted",
        "Your driver application has been submitted. An administrator must approve your account before you can start receiving deliveries.",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace("/driver"),
          },
        ],
      );
    } catch (err) {
      console.error("Driver registration failed:", err);

      Alert.alert(
        "Registration failed",
        err instanceof Error
          ? err.message
          : "Unable to register as a driver.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.icon}>🚴</Text>

      <Text style={styles.title}>
        Become a Driver
      </Text>

      <Text style={styles.subtitle}>
        Register your vehicle to start delivering orders
        through GrubnBite.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Vehicle Type
        </Text>

        <TextInput
          style={styles.input}
          value={vehicleType}
          onChangeText={setVehicleType}
          placeholder="e.g. Car, Motorcycle"
        />

        <Text style={styles.label}>
          Vehicle Registration
        </Text>

        <TextInput
          style={styles.input}
          value={vehicleRegistration}
          onChangeText={setVehicleRegistration}
          placeholder="e.g. CA 123-456"
          autoCapitalize="characters"
        />

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>ℹ️</Text>

          <Text style={styles.noticeText}>
            Your application will need to be approved by an
            administrator before you can accept deliveries.
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={register}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Submit Driver Application
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  icon: {
    fontSize: 52,
    textAlign: "center",
    marginTop: 30,
  },

  title: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 21,
  },

  card: {
    marginTop: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
    color: "#071B2C",
  },

  notice: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  noticeIcon: {
    fontSize: 16,
  },

  noticeText: {
    flex: 1,
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 19,
  },

  button: {
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});