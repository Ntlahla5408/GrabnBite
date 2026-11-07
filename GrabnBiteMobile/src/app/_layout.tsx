import { Stack } from "expo-router";
import { AuthProvider } from "../context/authContext";
import { ErrorFeedbackProvider } from "../context/ErrorFeedbackContext";
import { AppThemeColors, ThemePreferenceProvider, useThemePreference } from "../context/ThemeContext";

function RootNavigator() {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <ErrorFeedbackProvider>
          <RootNavigator />
        </ErrorFeedbackProvider>
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}
