import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748B",
  },
});
