import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{
    orderId?: string;
  }>();

  const orderId = params.orderId;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>✓</Text>

        <Text style={styles.title}>Payment Successful</Text>

        <Text style={styles.message}>
          Your payment was completed successfully.
        </Text>

        {orderId ? <Text style={styles.order}>Order #{orderId}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/order",
              params: {
                orderId: orderId ?? "",
              },
            })
          }
        >
          <Text style={styles.buttonText}>Track My Order</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.secondaryText}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },

  icon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 45,
    fontWeight: "700",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 10,
  },

  message: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
  },

  order: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#1A4B6B",
  },

  button: {
    width: "100%",
    backgroundColor: "#F28C28",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 15,
    padding: 10,
  },

  secondaryText: {
    color: "#1A4B6B",
    fontWeight: "600",
  },
});
