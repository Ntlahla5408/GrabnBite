import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface RestaurantCardProps {
  name: string;
  cuisine: string;
  isOpen: boolean;
  imageUrl: string | null;
  deliveryTime: string;
  onPress?: () => void;
}

export default function RestaurantCard({
  name,
  cuisine,
  isOpen,
  imageUrl,
  deliveryTime,
  onPress,
}: RestaurantCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>🍽️</Text>
          <Text style={styles.placeholderText}>No image available</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <Text style={styles.cuisine} numberOfLines={2}>
          {cuisine}
        </Text>

        <View style={styles.details}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOpen ? "#F97316" : "#94A3B8",
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: isOpen ? "#F97316" : "#64748B",
                },
              ]}
            >
              {isOpen ? "Open now" : "Closed"}
            </Text>
          </View>

          {isOpen && (
            <>
              <Text style={styles.separator}>•</Text>

              <Text style={styles.time}>{deliveryTime}</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 290,
    backgroundColor: "#0D2638",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 14,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 4,
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  image: {
    width: "100%",
    height: 165,
    backgroundColor: "#18384D",
  },

  imagePlaceholder: {
    width: "100%",
    height: 165,
    backgroundColor: "#18384D",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 42,
    marginBottom: 6,
  },

  placeholderText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  content: {
    padding: 15,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  cuisine: {
    marginTop: 5,
    color: "#B8C7D3",
    fontSize: 13,
    lineHeight: 18,
  },

  details: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  separator: {
    marginHorizontal: 7,
    color: "#64748B",
    fontSize: 12,
  },

  time: {
    color: "#CBD5E1",
    fontSize: 12,
  },
});
