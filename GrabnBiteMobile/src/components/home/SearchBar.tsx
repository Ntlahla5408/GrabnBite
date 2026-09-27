import { StyleSheet, Text, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>

      <TextInput
        style={styles.input}
        placeholder="Search for food or restaurants..."
        placeholderTextColor="#94A3B8"
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
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  icon: {
    fontSize: 28,
    color: "#64748B",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#172033",
  },
});
