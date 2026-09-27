import { router } from "expo-router";
import { useState } from "react";
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
import { useAuth } from "../context/authContext";

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
      <View style={styles.container}>
        {/* Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>G</Text>
          </View>

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

            <Pressable
              onPress={() => {
                // Register screen will be added next.
                console.log("REGISTER PRESSED");
              }}
            >
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
