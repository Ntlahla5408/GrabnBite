import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuCategories,
  getRestaurantMenu,
  MenuCategory,
  MenuItem,
  updateMenuItem,
} from "../services/menuService";
import { getMyRestaurant } from "../services/restaurantService";

export default function RestaurantMenuScreen() {
  const { user, token, loading: authLoading } = useAuth();

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  /*
   * -----------------------------
   * Security / role protection
   * -----------------------------
   */

  useEffect(() => {
    if (!authLoading && user?.role !== "Restaurant") {
      router.replace("/");
    }
  }, [authLoading, user]);

  /*
   * -----------------------------
   * Load restaurant + menu
   * -----------------------------
   */

  const loadMenu = useCallback(async () => {
    if (!token || user?.role !== "Restaurant") return;

    try {
      setError("");

      const restaurant = await getMyRestaurant(token);

      setRestaurantId(restaurant.restaurantId);
      setRestaurantName(restaurant.name);

      const [items, categoryData] = await Promise.all([
        getRestaurantMenu(restaurant.restaurantId),
        getMenuCategories(),
      ]);

      setMenuItems(items);
      setCategories(
        categoryData.filter(
          (category) => category.restaurantId === restaurant.restaurantId,
        ),
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load menu.");
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (!authLoading && token && user?.role === "Restaurant") {
      loadMenu();
    }
  }, [authLoading, token, user?.role, loadMenu]);

  /*
   * -----------------------------
   * Form helpers
   * -----------------------------
   */

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId(null);
    setIsAvailable(true);
    setEditingItem(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId(categories[0]?.menuCategoryId ?? null);
    setIsAvailable(true);
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCategoryId(item.menuCategoryId);
    setIsAvailable(item.isAvailable);
    setShowForm(true);
  };

  /*
   * -----------------------------
   * Save item
   * -----------------------------
   */

  const handleSave = async () => {
    if (!token || !restaurantId) return;

    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a menu item name.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Missing description", "Please enter a description.");
      return;
    }

    const numericPrice = Number(price);

    if (!price.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      Alert.alert("Invalid price", "Please enter a valid price.");
      return;
    }

    if (!editingItem && !categoryId) {
      Alert.alert("Missing category", "Please select a category.");
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        await updateMenuItem(
          restaurantId,
          editingItem.menuItemId,
          {
            name: name.trim(),
            description: description.trim(),
            price: numericPrice,
            isAvailable,
          },
          token,
        );
      } else {
        await createMenuItem(
          restaurantId,
          {
            name: name.trim(),
            description: description.trim(),
            price: numericPrice,
            isAvailable,
            menuCategoryId: categoryId!,
          },
          token,
        );
      }

      resetForm();
      await loadMenu();

      Alert.alert(
        "Success",
        editingItem
          ? "Menu item updated successfully."
          : "Menu item added successfully.",
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Unable to save",
        err?.message || "Something went wrong while saving the item.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * -----------------------------
   * Delete item
   * -----------------------------
   */

  const handleDelete = (item: MenuItem) => {
    if (!token || !restaurantId) return;

    Alert.alert(
      "Delete menu item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(item.menuItemId);

              await deleteMenuItem(restaurantId, item.menuItemId, token);

              await loadMenu();

              Alert.alert("Deleted", "Menu item deleted successfully.");
            } catch (err: any) {
              console.error(err);
              Alert.alert(
                "Unable to delete",
                err?.message || "Something went wrong while deleting.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  /*
   * -----------------------------
   * Group menu by category
   * -----------------------------
   */

  const groupedMenu = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: menuItems.filter(
        (item) => item.menuCategoryId === category.menuCategoryId,
      ),
    }));
  }, [categories, menuItems]);

  /*
   * -----------------------------
   * Loading / protection
   * -----------------------------
   */

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token || user?.role !== "Restaurant") {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your menu...</Text>
      </View>
    );
  }

  /*
   * -----------------------------
   * UI
   * -----------------------------
   */

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>Manage Menu</Text>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable onPress={loadMenu}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Add button */}
        {!showForm && (
          <Pressable style={styles.addButton} onPress={openAddForm}>
            <Text style={styles.addButtonText}>+ Add Menu Item</Text>
          </Pressable>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </Text>

              <Pressable onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Name</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Classic Beef Burger"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Description</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the item"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.label}>Price</Text>

            <TextInput
              style={styles.input}
              placeholder="59.99"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            {!editingItem && (
              <>
                <Text style={styles.label}>Category</Text>

                {categories.length === 0 ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      No categories are available for this restaurant yet.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.categoryList}>
                    {categories.map((category) => {
                      const selected = categoryId === category.menuCategoryId;

                      return (
                        <Pressable
                          key={category.menuCategoryId}
                          style={[
                            styles.categoryOption,
                            selected && styles.categoryOptionSelected,
                          ]}
                          onPress={() => setCategoryId(category.menuCategoryId)}
                        >
                          <Text
                            style={[
                              styles.categoryOptionText,
                              selected && styles.categoryOptionTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            <View style={styles.availabilityRow}>
              <View>
                <Text style={styles.label}>Available</Text>
                <Text style={styles.helperText}>
                  Customers can order this item when enabled.
                </Text>
              </View>

              <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingItem ? "Save Changes" : "Add Item"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Your Menu</Text>

          {menuItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No menu items yet</Text>

              <Text style={styles.emptyText}>
                Add your first menu item to start building your restaurant menu.
              </Text>
            </View>
          ) : (
            groupedMenu.map(({ category, items }) => {
              if (items.length === 0) return null;

              return (
                <View
                  key={category.menuCategoryId}
                  style={styles.categorySection}
                >
                  <Text style={styles.categoryTitle}>{category.name}</Text>

                  {items.map((item) => (
                    <View key={item.menuItemId} style={styles.itemCard}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>

                        <Text style={styles.itemDescription}>
                          {item.description}
                        </Text>

                        <View style={styles.itemBottomRow}>
                          <Text style={styles.itemPrice}>
                            R{item.price.toFixed(2)}
                          </Text>

                          <View
                            style={[
                              styles.statusBadge,
                              item.isAvailable
                                ? styles.availableBadge
                                : styles.unavailableBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                item.isAvailable
                                  ? styles.availableText
                                  : styles.unavailableText,
                              ]}
                            >
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.itemActions}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => openEditForm(item)}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDelete(item)}
                          disabled={deletingId === item.menuItemId}
                        >
                          {deletingId === item.menuItemId ? (
                            <ActivityIndicator size="small" />
                          ) : (
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  loadingText: {
    marginTop: 10,
    color: "#555",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#071B2C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backText: {
    color: "#fff",
    fontSize: 25,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  restaurantName: {
    marginTop: 3,
    color: "#6B7280",
    fontSize: 15,
  },

  addButton: {
    backgroundColor: "#F47C20",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },

  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  errorText: {
    color: "#991B1B",
    marginBottom: 8,
  },

  retryText: {
    color: "#B91C1C",
    fontWeight: "800",
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    elevation: 2,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#071B2C",
  },

  cancelText: {
    color: "#F47C20",
    fontWeight: "700",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#071B2C",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryOption: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },

  categoryOptionSelected: {
    backgroundColor: "#071B2C",
    borderColor: "#071B2C",
  },

  categoryOptionText: {
    color: "#374151",
    fontWeight: "600",
  },

  categoryOptionTextSelected: {
    color: "#fff",
  },

  availabilityRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  helperText: {
    color: "#6B7280",
    fontSize: 12,
    maxWidth: 260,
  },

  saveButton: {
    backgroundColor: "#F47C20",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.6,
  },

  warningBox: {
    backgroundColor: "#FFF7ED",
    padding: 12,
    borderRadius: 10,
  },

  warningText: {
    color: "#9A3412",
    fontSize: 13,
  },

  menuSection: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
    marginBottom: 18,
  },

  categorySection: {
    marginBottom: 24,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F47C20",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 1,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  itemDescription: {
    marginTop: 5,
    color: "#6B7280",
    lineHeight: 19,
  },

  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  itemPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#071B2C",
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  availableBadge: {
    backgroundColor: "#DCFCE7",
  },

  unavailableBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  availableText: {
    color: "#166534",
  },

  unavailableText: {
    color: "#991B1B",
  },

  itemActions: {
    justifyContent: "center",
    gap: 8,
  },

  editButton: {
    borderWidth: 1,
    borderColor: "#071B2C",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  editButtonText: {
    color: "#071B2C",
    fontWeight: "700",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 20,
  },
});
