import { Stack } from "expo-router";
import { AuthProvider } from "../context/authContext";
import { ThemePreferenceProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }} />
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}
