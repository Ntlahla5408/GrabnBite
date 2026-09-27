import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

const categories = [
  { name: "Burgers", icon: "🍔" },
  { name: "Pizza", icon: "🍕" },
  { name: "Chicken", icon: "🍗" },
  { name: "Fast Food", icon: "🍟" },
  { name: "Healthy", icon: "🥗" },
  { name: "Drinks", icon: "🥤" },
];

export default function CategoryList() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <Pressable key={category.name} style={styles.category}>
          <Text style={styles.icon}>{category.icon}</Text>
          <Text style={styles.name}>{category.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 12,
  },

  category: {
    width: 105,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 28,
    marginBottom: 6,
  },

  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#172033",
  },
});
