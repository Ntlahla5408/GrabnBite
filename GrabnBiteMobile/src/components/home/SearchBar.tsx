import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppThemeColors, useThemePreference } from "../../context/ThemeContext";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={styles.icon}>⌕</Text>

      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder="Search for food or restaurants..."
        placeholderTextColor="#7F94A3"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    width: "100%",
    maxWidth: 700,
    backgroundColor: "#0D2638",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#18384D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  icon: {
    fontSize: 26,
    color: "#F97316",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
});
