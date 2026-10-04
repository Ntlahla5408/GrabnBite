import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";

const logo = require("../../assets/images/GrabnbiteLogo.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login(email.trim(), password);

      console.log("LOGIN SUCCESS:", result);
      console.log("USER ROLE:", result.role);

      Alert.alert("Welcome!", `Welcome back, ${result.firstName}!`);

      if (result.role === "Admin") {
        router.replace("/admin-dashboard");
      } else if (result.role === "Restaurant") {
        router.replace("/restaurant-dashboard");
      } else if (result.role === "Customer") {
        router.replace("/");
      } else if (result.role === "Driver") {
        router.replace("/driver-dashboard");
      } else {
        Alert.alert(
          "Login successful",
          "Your account role is not supported yet.",
        );
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      Alert.alert("Login failed", "Please check your email and password.");
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

      <View style={styles.container}>
        {/* Branding */}
        <View style={styles.brandContainer}>
          <Image source={logo} style={styles.brandLogo} />

          <Text style={styles.brand}>GrabnBite</Text>

          <Text style={styles.tagline}>Your next meal starts here.</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>

          <Text style={styles.description}>
            Sign in to continue ordering your favourite meals.
          </Text>

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

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Login */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </Pressable>

          {/* Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </View>
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

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  brandContainer: {
    alignItems: "center",
    marginBottom: 26,
  },

  brandLogo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    marginBottom: 10,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 30,
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
    borderRadius: 20,
    padding: 28,

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

  loginButton: {
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

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 5,
  },

  registerText: {
    color: "#64748B",
    fontSize: 14,
  },

  registerLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },
});
