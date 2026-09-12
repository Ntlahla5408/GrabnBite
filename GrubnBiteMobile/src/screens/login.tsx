import { FoodColors } from "@/constants/theme";
import { login } from "@/services/authservice";
import { getRoleHome, saveSession } from "@/services/sessionService";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const result = await login({
        email: email.trim(),
        password,
      });

      console.log("Login successful!");
      console.log("User:", result);

      await saveSession(result.token, {
          userId: result.userId,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          role: result.role,
      });

      // For now, return to the existing home screen.
      // We will create the real role-based screens next.
      router.replace(getRoleHome(result.role) as any);
    } catch (error) {
      console.error("Login error:", error);

      Alert.alert(
        "Login failed",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>GrubnBite</Text>
            <Text style={styles.subtitle}>Good food. Good mood.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.description}>
              Login to your account to continue.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={FoodColors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={FoodColors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => console.log("Forgot password pressed")}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Signing in..." : "Login"}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FoodColors.oat,
  },

  scrollContainer: {
    flexGrow: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingVertical: 28,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 42,
  },

  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: FoodColors.tomato,
    letterSpacing: 0,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: FoodColors.muted,
  },

  form: {
    width: "100%",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: FoodColors.ink,
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    color: FoodColors.muted,
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: FoodColors.ink,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: FoodColors.line,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: FoodColors.ink,
    backgroundColor: FoodColors.surface,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },

  forgotText: {
    fontSize: 14,
    color: FoodColors.tomato,
    fontWeight: "600",
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: FoodColors.tomato,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: FoodColors.onDark,
    fontSize: 16,
    fontWeight: "700",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  registerText: {
    fontSize: 14,
    color: FoodColors.muted,
  },

  registerLink: {
    marginLeft: 5,
    fontSize: 14,
    color: FoodColors.tomato,
    fontWeight: "700",
  },
});