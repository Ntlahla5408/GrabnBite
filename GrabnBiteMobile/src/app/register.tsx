import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { register } from "../services/authService";
import { ComponentSize, Layout, Radius, Spacing, Typography } from "../constants/designSystem";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";

const logo = require("../../assets/images/inside-icon.png");

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"Customer" | "Restaurant" | "Driver">("Customer");
  const [loading, setLoading] = useState(false);
  const { showError } = useErrorFeedback();

  const handleRegister = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      showError({ title: "Complete your details", message: "Please fill in all the required fields before creating your account." });
      return;
    }

    if (password !== confirmPassword) {
      showError({ title: "Passwords do not match", message: "The passwords you entered are different. Check both fields and try again." });
      return;
    }

    if (password.length < 6) {
      showError({ title: "Choose a stronger password", message: "Your password must contain at least 6 characters." });
      return;
    }

    try {
      setLoading(true);

      const result = await register(
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        accountType,
      );

      router.replace({
        pathname: "/verify-email",
        params: {
          email: result.email,
          emailSent: String(result.emailSent),
        },
      });
    } catch (error) {
      logAppError("Creating customer account", error);
      showError(getUserFacingError(error, {
        title: "We could not create your account",
        message: "GrabnBite could not complete your registration. Please check your details and try again.",
        actionLabel: "Try again",
      }), () => { void handleRegister(); });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Logo */}
      <View pointerEvents="none" style={styles.backgroundLogoContainer}>
        <Image
          source={logo}
          style={styles.backgroundLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Branding */}
          <View style={styles.brandContainer}>
            <Image source={logo} style={styles.brandLogo} />

            <Text style={styles.brand}>GrabnBite</Text>

            <Text style={styles.tagline}>Your next meal starts here.</Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>

            <Text style={styles.description}>
              Create an account to order meals, register a restaurant or apply to become a delivery partner.
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Account type</Text>
              <View style={styles.accountTypeRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: accountType === "Customer" }}
                  style={[styles.accountTypeButton, accountType === "Customer" && styles.accountTypeButtonSelected]}
                  onPress={() => setAccountType("Customer")}
                >
                  <Text style={[styles.accountTypeText, accountType === "Customer" && styles.accountTypeTextSelected]}>Customer</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: accountType === "Restaurant" }}
                  style={[styles.accountTypeButton, accountType === "Restaurant" && styles.accountTypeButtonSelected]}
                  onPress={() => setAccountType("Restaurant")}
                >
                  <Text style={[styles.accountTypeText, accountType === "Restaurant" && styles.accountTypeTextSelected]}>Restaurant partner</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: accountType === "Driver" }}
                  style={[styles.accountTypeButton, accountType === "Driver" && styles.accountTypeButtonSelected]}
                  onPress={() => setAccountType("Driver")}
                >
                  <Text style={[styles.accountTypeText, accountType === "Driver" && styles.accountTypeTextSelected]}>Driver partner</Text>
                </Pressable>
              </View>
              {accountType === "Restaurant" ? (
                <Text style={styles.accountTypeHint}>A draft partner application will be created. Your restaurant will only become operational after administrator approval.</Text>
              ) : null}
              {accountType === "Driver" ? (
                <Text style={styles.accountTypeHint}>A delivery partner application will be created. You will provide your details and supporting documents, then wait for administrator approval before accepting deliveries.</Text>
              ) : null}
            </View>

            {/* First Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>First Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Last Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Last Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#94A3B8"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Register */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={() => {
                console.log("BUTTON PRESSED");
                handleRegister();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </Pressable>

            {/* Back to Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>

              <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071B2C",
    position: "relative",
  },

  backgroundLogoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  backgroundLogo: {
    width: 520,
    height: 520,
    opacity: 0.06,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(7, 27, 44, 0.25)",
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  container: {
    alignItems: "center",
    paddingHorizontal: Layout.screenHorizontal,
    paddingVertical: Spacing.xl,
  },

  brandContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  brandLogo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    marginBottom: 10,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: Typography.title,
    fontWeight: "800",
  },

  tagline: {
    color: "#AFC0CC",
    fontSize: 14,
    marginTop: 5,
  },

  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.panel,
    padding: Layout.cardPadding,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,

    elevation: 8,
  },

  heading: {
    color: "#071B2C",
    fontSize: Typography.title,
    fontWeight: "700",
    marginBottom: 8,
  },

  description: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },

  fieldContainer: {
    marginBottom: Spacing.md,
  },

  accountTypeRow: {
    flexDirection: "row",
    gap: 10,
  },

  accountTypeButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  accountTypeButtonSelected: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },

  accountTypeText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  accountTypeTextSelected: {
    color: "#C2410C",
  },

  accountTypeHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  label: {
    color: "#071B2C",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: ComponentSize.inputHeight,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#071B2C",
    backgroundColor: "#F8FAFC",
  },

  registerButton: {
    height: ComponentSize.buttonHeight,
    backgroundColor: "#F97316",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: 5,
  },

  loginText: {
    color: "#64748B",
    fontSize: 14,
  },

  loginLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },
});
