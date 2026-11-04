import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  resendEmailVerification,
  verifyEmail,
} from "../services/authService";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    emailSent?: string;
  }>();
  const email = typeof params.email === "string" ? params.email : "";
  const emailSent = params.emailSent !== "false";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    params.emailSent === "true" || params.emailSent === "false" ? 60 : 0,
  );

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Return to registration and enter your email address.");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      Alert.alert("Invalid code", "Enter the six-digit code sent to your email.");
      return;
    }

    try {
      setLoading(true);
      await verifyEmail(email, code);
      Alert.alert(
        "Email verified",
        "Your email address has been verified. You can now sign in.",
        [{ text: "Continue", onPress: () => router.replace("/login") }],
      );
    } catch (error) {
      Alert.alert(
        "Verification failed",
        error instanceof Error ? error.message : "The code could not be verified.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Return to registration and enter your email address.");
      return;
    }

    try {
      setResending(true);
      await resendEmailVerification(email);
      setResendCooldown(60);
      Alert.alert(
        "Request received",
        "If the account needs verification, a new code will be sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      Alert.alert(
        "Unable to resend",
        error instanceof Error ? error.message : "Please try again later.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.brand}>GrabnBite</Text>
          <Text style={styles.heading}>Verify your email</Text>
          <Text style={styles.description}>
            {emailSent
              ? "Enter the six-digit verification code sent to:"
              : "Your account was created, but the verification email could not be sent. You can request another code."}
          </Text>
          <Text style={styles.email}>{email || "No email address supplied"}</Text>

          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={6}
            autoComplete="one-time-code"
          />

          <Text style={styles.hint}>The code expires after 10 minutes.</Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading || resending}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify email</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              (resending || resendCooldown > 0) && styles.buttonDisabled,
            ]}
            onPress={handleResend}
            disabled={resending || loading || resendCooldown > 0}
          >
            {resending ? (
              <ActivityIndicator color="#C2410C" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend verification code"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace("/login")} style={styles.backButton}>
            <Text style={styles.backText}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071B2C",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
  },
  brand: {
    color: "#F97316",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 22,
  },
  heading: {
    color: "#071B2C",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
  },
  email: {
    color: "#071B2C",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 24,
  },
  label: {
    color: "#071B2C",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    color: "#071B2C",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
  },
  hint: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 22,
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#F97316",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#C2410C",
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    alignItems: "center",
    marginTop: 12,
    padding: 8,
  },
  backText: {
    color: "#64748B",
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});