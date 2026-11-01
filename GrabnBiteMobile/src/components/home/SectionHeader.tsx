import { StyleSheet, Text, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../../context/ThemeContext";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.accent }]}>{title}</Text>

      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },

  title: {
    color: "#F47721",
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 4,
    color: "#AFC0CC",
    fontSize: 13,
    lineHeight: 19,
  },
});
