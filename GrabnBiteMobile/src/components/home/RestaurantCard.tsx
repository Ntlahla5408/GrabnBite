import { Pressable, StyleSheet, Text, View } from "react-native";

interface RestaurantCardProps {
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  onPress?: () => void;
}

export default function RestaurantCard({
  name,
  cuisine,
  rating,
  deliveryTime,
  onPress,
}: RestaurantCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderText}>🍽️</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <Text style={styles.cuisine} numberOfLines={1}>
          {cuisine}
        </Text>

        <View style={styles.details}>
          <Text style={styles.rating}>★ {rating}</Text>
          <Text style={styles.time}>• {deliveryTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  imagePlaceholder: {
    height: 150,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 50,
  },

  content: {
    padding: 14,
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  cuisine: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  details: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  rating: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F97316",
  },

  time: {
    marginLeft: 8,
    fontSize: 13,
    color: "#64748B",
  },
});
