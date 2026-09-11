import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  muted: "#6B7280",
};

export default function AdminDrivers() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Admin</Text>
        </Pressable>

        <Text style={styles.title}>Driver Management</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🚗</Text>

        <Text style={styles.heading}>Driver approval</Text>

        <Text style={styles.description}>
          The backend currently supports approving a driver when the driver ID
          is known, but it does not currently expose an endpoint for listing
          all drivers or pending driver applications.
        </Text>

        <Text style={styles.nextStep}>
          Backend endpoint needed:
        </Text>

        <View style={styles.endpoint}>
          <Text style={styles.endpointText}>GET /api/Driver</Text>
        </View>

        <Text style={styles.description}>
          Once that endpoint exists, this screen can display pending drivers
          and provide an Approve button.
        </Text>
      </View>
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
    fontWeight: "700",
    marginBottom: 12,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
  },

  content: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },

  icon: {
    fontSize: 52,
  },

  heading: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.navy,
  },

  description: {
    marginTop: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
  },

  nextStep: {
    marginTop: 22,
    fontWeight: "800",
    color: COLORS.navy,
  },

  endpoint: {
    marginTop: 8,
    backgroundColor: "#EEF3F6",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  endpointText: {
    color: COLORS.blue,
    fontWeight: "800",
  },
});