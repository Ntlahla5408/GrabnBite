import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  getMenuCategories,
  getMenuItemsByRestaurant,
  updateMenuCategory,
  updateMenuItem,
} from "@/services/adminService";

export default function RestaurantMenu() {
  const params = useLocalSearchParams<{ restaurantId?: string }>();

  const restaurantId = Number(params.restaurantId);

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const [savingCategory, setSavingCategory] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  const loadMenu = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [categoryData, itemData] = await Promise.all([
        getMenuCategories(),
        getMenuItemsByRestaurant(restaurantId),
      ]);

      setCategories(categoryData);
      setMenuItems(itemData);
    } catch (err) {
      Alert.alert(
        "Could not load menu",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Missing information", "Enter a category name.");
      return;
    }

    try {
      setSavingCategory(true);

      await createMenuCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      });

      setCategoryName("");
      setCategoryDescription("");

      await loadMenu();
    } catch (err) {
      Alert.alert(
        "Could not create category",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCreateItem = async () => {
    if (!itemName.trim()) {
      Alert.alert("Missing information", "Enter a menu item name.");
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert("Select category", "Choose a menu category first.");
      return;
    }

    const price = Number(itemPrice);

    if (!Number.isFinite(price) || price < 0) {
      Alert.alert("Invalid price", "Enter a valid price.");
      return;
    }

    try {
      setSavingItem(true);

      await createMenuItem({
        name: itemName.trim(),
        description: itemDescription.trim(),
        price,
        isAvailable: true,
        menuCategoryId: selectedCategoryId,
      });

      setItemName("");
      setItemDescription("");
      setItemPrice("");

      await loadMenu();
    } catch (err) {
      Alert.alert(
        "Could not create menu item",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSavingItem(false);
    }
  };

  const toggleItemAvailability = async (item: any) => {
    try {
      await updateMenuItem(item.id, {
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        isAvailable: !item.isAvailable,
      });

      await loadMenu();
    } catch (err) {
      Alert.alert(
        "Could not update item",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleDeleteItem = (item: any) => {
    Alert.alert(
      "Delete menu item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
              await loadMenu();
            } catch (err) {
              Alert.alert(
                "Could not delete item",
                err instanceof Error ? err.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteCategory = (category: any) => {
    Alert.alert(
      "Delete category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuCategory(category.id);
              await loadMenu();
            } catch (err) {
              Alert.alert(
                "Could not delete category",
                err instanceof Error ? err.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <RoleGuard
  allowedRoles={["restaurant", "restaurantstaff", "staff"]}
>
 <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#071B2C" />
        </Pressable>

        <View>
          <Text style={styles.title}>Manage Menu</Text>
          <Text style={styles.subtitle}>
            Categories and menu items
          </Text>
        </View>
      </View>

      {/* Categories */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Categories</Text>

        {categories.length === 0 ? (
          <Text style={styles.emptyText}>
            No categories have been created yet.
          </Text>
        ) : (
          categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>

                {category.description ? (
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => handleDeleteCategory(category)}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={19} color="#DC2626" />
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.formTitle}>Add Category</Text>

        <TextInput
          style={styles.input}
          placeholder="Category name"
          value={categoryName}
          onChangeText={setCategoryName}
        />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description"
          value={categoryDescription}
          onChangeText={setCategoryDescription}
          multiline
        />

        <Pressable
          style={styles.primaryButton}
          onPress={handleCreateCategory}
          disabled={savingCategory}
        >
          {savingCategory ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Add Category
            </Text>
          )}
        </Pressable>
      </View>

      {/* Menu Items */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Items</Text>

        {menuItems.length === 0 ? (
          <Text style={styles.emptyText}>
            No menu items have been created yet.
          </Text>
        ) : (
          menuItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>

                {item.description ? (
                  <Text style={styles.itemDescription}>
                    {item.description}
                  </Text>
                ) : null}

                <Text style={styles.itemPrice}>
                  R{Number(item.price ?? 0).toFixed(2)}
                </Text>

                <Text
                  style={[
                    styles.availability,
                    {
                      color: item.isAvailable
                        ? "#16A34A"
                        : "#DC2626",
                    },
                  ]}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Text>
              </View>

              <View style={styles.itemActions}>
                <Pressable
                  style={styles.smallButton}
                  onPress={() => toggleItemAvailability(item)}
                >
                  <Ionicons
                    name={
                      item.isAvailable
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={19}
                    color="#1A4B6B"
                  />
                </Pressable>

                <Pressable
                  style={styles.smallButton}
                  onPress={() => handleDeleteItem(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color="#DC2626"
                  />
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.formTitle}>Add Menu Item</Text>

        <TextInput
          style={styles.input}
          placeholder="Item name"
          value={itemName}
          onChangeText={setItemName}
        />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description"
          value={itemDescription}
          onChangeText={setItemDescription}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Price"
          value={itemPrice}
          onChangeText={setItemPrice}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Category</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySelector}
        >
          {categories.map((category) => {
            const selected = selectedCategoryId === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[
                  styles.categoryChoice,
                  selected && styles.selectedCategoryChoice,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChoiceText,
                    selected && styles.selectedCategoryChoiceText,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={styles.primaryButton}
          onPress={handleCreateItem}
          disabled={savingItem}
        >
          {savingItem ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Add Menu Item
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
</RoleGuard>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
  },

  section: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 16,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#071B2C",
    marginTop: 22,
    marginBottom: 10,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    marginBottom: 10,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#071B2C",
  },

  categoryDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  itemCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    marginBottom: 10,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#071B2C",
  },

  itemDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  itemPrice: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "#1A4B6B",
  },

  availability: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  itemActions: {
    justifyContent: "center",
    gap: 5,
  },

  smallButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    color: "#071B2C",
  },

  multiline: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginTop: 5,
    marginBottom: 8,
  },

  categorySelector: {
    gap: 8,
    paddingBottom: 5,
  },

  categoryChoice: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  selectedCategoryChoice: {
    backgroundColor: "#1A4B6B",
    borderColor: "#1A4B6B",
  },

  categoryChoiceText: {
    color: "#334155",
    fontWeight: "700",
  },

  selectedCategoryChoiceText: {
    color: "#FFFFFF",
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#1A4B6B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
});