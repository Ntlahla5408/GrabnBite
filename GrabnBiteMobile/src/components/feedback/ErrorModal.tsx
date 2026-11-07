import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../../context/ThemeContext";

type ErrorModalProps = {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
};

export default function ErrorModal({
  visible,
  title,
  message,
  actionLabel,
  onAction,
  onClose,
}: ErrorModalProps) {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme === "dark" ? "#482A2A" : "#FDECEC" }]}>
            <Text style={styles.icon}>!</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              onPress={onAction}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            style={[styles.dismissButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.dismissButtonText, { color: colors.text }]}>
              {actionLabel && onAction ? "Close" : "Okay"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: { color: "#D64545", fontSize: 30, fontWeight: "800", lineHeight: 34 },
  title: { fontSize: 19, fontWeight: "800", textAlign: "center", marginBottom: 9 },
  message: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 },
  primaryButton: {
    minHeight: 46,
    width: "100%",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  dismissButton: {
    minHeight: 44,
    width: "100%",
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: { fontSize: 14, fontWeight: "700" },
});
