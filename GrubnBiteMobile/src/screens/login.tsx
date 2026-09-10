import { getRoleHome } from "@/services/sessionService";
import { login } from "@/services/authservice";
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

  const handleLogin = async () => {
    if (!email || !password) {
      console.log("Please enter your email and password.");
      return;
    }

    try {
      const result = await login({
        email,
        password,
      });

      console.log("Login successful!");
      console.log("User:", result);

      // Store the JWT for the current web session
      localStorage.setItem("grubnbite_token", result.token);

      // Store the logged-in user's information
      localStorage.setItem(
        "grubnbite_user",
        JSON.stringify({
          userId: result.userId,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          role: result.role,
        }),
      );

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
                placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
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
    backgroundColor: "#FFFFFF",
  },

  scrollContainer: {
    flexGrow: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 50,
  },

  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: "#208AEF",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#777",
  },

  form: {
    width: "100%",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    color: "#777",
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#FAFAFA",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },

  forgotText: {
    fontSize: 14,
    color: "#208AEF",
    fontWeight: "600",
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
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
    color: "#777",
  },

  registerLink: {
    marginLeft: 5,
    fontSize: 14,
    color: "#208AEF",
    fontWeight: "700",
  },
});