import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
        <Pressable
          key={category.name}
          style={({ pressed }) => [
            styles.category,
            pressed && styles.categoryPressed,
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{category.icon}</Text>
          </View>

          <Text style={styles.name}>{category.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
    paddingRight: 20,
    gap: 12,
  },

  category: {
    width: 82,
    alignItems: "center",
  },

  categoryPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0D2638",
    borderWidth: 1,
    borderColor: "#18384D",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  icon: {
    fontSize: 28,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
