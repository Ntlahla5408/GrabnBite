import { useEffect, useState } from "react";
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
import { router } from "expo-router";

import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuCategory,
  updateMenuItem,
  type MenuCategory,
  type MenuItem,
} from "@/services/adminService";

const COLORS = {
  navy: "#071B2C",
  blue: "#2C7A9E",
  white: "#FFFFFF",
  background: "#F5F7F9",
  text: "#17212B",
  muted: "#6B7280",
  border: "#E1E7EB",
  green: "#228B55",
  red: "#C83C3C",
};

export default function AdminMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [savingCategory, setSavingCategory] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);

      const [categoryData, itemData] = await Promise.all([
        getMenuCategories(),
        getMenuItems(),
      ]);

      setCategories(categoryData);
      setItems(itemData);

      if (itemCategoryId === null && categoryData.length > 0) {
        setItemCategoryId(categoryData[0].id);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to load menu data.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // CATEGORY
  // -----------------------------

  const resetCategory = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryDescription("");
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Missing information", "Category name is required.");
      return;
    }

    try {
      setSavingCategory(true);

      if (editingCategoryId !== null) {
        await updateMenuCategory(editingCategoryId, {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        });
      } else {
        await createMenuCategory({
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        });
      }

      resetCategory();
      await loadMenu();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to save category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const editCategory = (category: MenuCategory) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description ?? "");
  };

  const removeCategory = async (category: MenuCategory) => {
    Alert.alert(
      "Delete category",
      `Delete ${category.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuCategory(category.id);
              await loadMenu();
            } catch (error) {
              Alert.alert(
                "Unable to delete",
                "The category may still be used by menu items.",
              );
            }
          },
        },
      ],
    );
  };

  // -----------------------------
  // MENU ITEMS
  // -----------------------------

  const resetItem = () => {
    setEditingItemId(null);
    setItemName("");
    setItemDescription("");
    setItemPrice("");
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      Alert.alert("Missing information", "Name and price are required.");
      return;
    }

    if (itemCategoryId === null) {
      Alert.alert("Category required", "Select a menu category first.");
      return;
    }

    const price = Number(itemPrice);

    if (Number.isNaN(price) || price < 0) {
      Alert.alert("Invalid price", "Enter a valid price.");
      return;
    }

    try {
      setSavingItem(true);

      if (editingItemId !== null) {
        await updateMenuItem(editingItemId, {
          name: itemName.trim(),
          description: itemDescription.trim(),
          price,
          isAvailable: true,
        });
      } else {
        await createMenuItem({
          name: itemName.trim(),
          description: itemDescription.trim(),
          price,
          isAvailable: true,
          menuCategoryId: itemCategoryId,
        });
      }

      resetItem();
      await loadMenu();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to save menu item.");
    } finally {
      setSavingItem(false);
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemDescription(item.description ?? "");
    setItemPrice(String(item.price));
    setItemCategoryId(item.menuCategoryId);
  };

  const removeItem = async (item: MenuItem) => {
    Alert.alert(
      "Delete menu item",
      `Delete ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
              await loadMenu();
            } catch (error) {
              Alert.alert("Error", "Unable to delete menu item.");
            }
          },
        },
      ],
    );
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, {
        name: item.name,
        description: item.description,
        price: item.price,
        isAvailable: !item.isAvailable,
      });

      await loadMenu();
    } catch (error) {
      Alert.alert("Error", "Unable to change availability.");
    }
  };

  const categoryNameFor = (categoryId: number) => {
    return (
      categories.find((category) => category.id === categoryId)?.name ??
      "Unknown category"
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Admin</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Menu Management</Text>
      </View>

      {/* CATEGORY FORM */}

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingCategoryId !== null
            ? "Edit Category"
            : "Create Menu Category"}
        </Text>

        <Input
          label="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
        />

        <Input
          label="Description"
          value={categoryDescription}
          onChangeText={setCategoryDescription}
          multiline
        />

        <Pressable
          style={styles.primaryButton}
          onPress={saveCategory}
          disabled={savingCategory}
        >
          {savingCategory ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {editingCategoryId !== null
                ? "Update Category"
                : "Create Category"}
            </Text>
          )}
        </Pressable>

        {editingCategoryId !== null && (
          <Pressable onPress={resetCategory} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel Editing</Text>
          </Pressable>
        )}
      </View>

      {/* CATEGORIES */}

      <Text style={styles.sectionTitle}>Categories</Text>

      {categories.length === 0 ? (
        <Text style={styles.empty}>No categories yet.</Text>
      ) : (
        categories.map((category) => (
          <View style={styles.categoryCard} key={category.id}>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryName}>{category.name}</Text>

              <Text style={styles.description}>
                {category.description || "No description"}
              </Text>
            </View>

            <Pressable onPress={() => editCategory(category)}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable onPress={() => removeCategory(category)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}

      {/* ITEM FORM */}

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingItemId !== null ? "Edit Menu Item" : "Create Menu Item"}
        </Text>

        <Input
          label="Item Name"
          value={itemName}
          onChangeText={setItemName}
        />

        <Input
          label="Description"
          value={itemDescription}
          onChangeText={setItemDescription}
          multiline
        />

        <Input
          label="Price"
          value={itemPrice}
          onChangeText={setItemPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Category</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelector}
        >
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                itemCategoryId === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setItemCategoryId(category.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  itemCategoryId === category.id &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={styles.primaryButton}
          onPress={saveItem}
          disabled={savingItem}
        >
          {savingItem ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {editingItemId !== null ? "Update Item" : "Create Item"}
            </Text>
          )}
        </Pressable>

        {editingItemId !== null && (
          <Pressable onPress={resetItem} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel Editing</Text>
          </Pressable>
        )}
      </View>

      {/* ITEMS */}

      <Text style={styles.sectionTitle}>Menu Items</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No menu items yet.</Text>
      ) : (
        items.map((item) => (
          <View style={styles.itemCard} key={item.id}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>

              <Text style={styles.categoryLabel}>
                {categoryNameFor(item.menuCategoryId)}
              </Text>

              <Text style={styles.description}>
                {item.description || "No description"}
              </Text>

              <Text style={styles.price}>
                R {Number(item.price).toFixed(2)}
              </Text>
            </View>

            <View style={styles.itemActions}>
              <Pressable
                onPress={() => toggleItemAvailability(item)}
                style={[
                  styles.availability,
                  item.isAvailable
                    ? styles.available
                    : styles.unavailable,
                ]}
              >
                <Text style={styles.availabilityText}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Text>
              </Pressable>

              <Pressable onPress={() => editItem(item)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>

              <Pressable onPress={() => removeItem(item)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 20,
    paddingTop: 24,
  },

  back: {
    color: "#D9E6ED",
    fontWeight: "700",
    marginBottom: 12,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
  },

  form: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FAFBFC",
    color: COLORS.text,
  },

  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  cancelButton: {
    alignItems: "center",
    marginTop: 12,
  },

  cancelText: {
    color: COLORS.red,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  categoryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  description: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
  },

  editText: {
    color: COLORS.blue,
    fontWeight: "800",
  },

  deleteText: {
    color: COLORS.red,
    fontWeight: "800",
  },

  categorySelector: {
    marginBottom: 16,
  },

  categoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
  },

  categoryChipActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  categoryChipText: {
    color: COLORS.text,
    fontWeight: "700",
  },

  categoryChipTextActive: {
    color: COLORS.white,
  },

  itemCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
  },

  itemName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  categoryLabel: {
    marginTop: 5,
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },

  price: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.navy,
  },

  itemActions: {
    alignItems: "flex-end",
    gap: 12,
    marginLeft: 10,
  },

  availability: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  available: {
    backgroundColor: "#E7F6ED",
  },

  unavailable: {
    backgroundColor: "#FCEAEA",
  },

  availabilityText: {
    fontSize: 11,
    fontWeight: "800",
  },

  empty: {
    textAlign: "center",
    color: COLORS.muted,
    marginBottom: 25,
  },
});