import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    console.log("CREATE ACCOUNT PRESSED");

    console.log("FORM DATA:", {
      firstName,
      lastName,
      email,
      phoneNumber,
      passwordEntered: !!password,
      confirmPasswordEntered: !!confirmPassword,
    });

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      console.log("VALIDATION FAILED");

      Alert.alert("Error", "Please complete all fields.");
      return;
    }

    console.log("VALIDATION PASSED");

    if (password !== confirmPassword) {
      console.log("PASSWORDS DO NOT MATCH");

      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      console.log("PASSWORD TOO SHORT");

      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    console.log("STARTING REGISTER API CALL");

    try {
      setLoading(true);

      const result = await register(
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
      );

      console.log("REGISTER SUCCESS:", result);

      Alert.alert(
        "Account created",
        "Your GrabnBite account has been created. Please log in.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      Alert.alert(
        "Registration failed",
        "We could not create your account. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>G</Text>
            </View>

            <Text style={styles.brand}>GrabnBite</Text>

            <Text style={styles.tagline}>Your next meal starts here.</Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>

            <Text style={styles.description}>
              Sign up to start ordering your favourite meals.
            </Text>

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
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  brandContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },

  tagline: {
    color: "#CBD5E1",
    fontSize: 15,
    marginTop: 5,
  },

  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
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
    marginBottom: 24,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    color: "#071B2C",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#071B2C",
    backgroundColor: "#F8FAFC",
  },

  registerButton: {
    height: 52,
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
    marginTop: 24,
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
