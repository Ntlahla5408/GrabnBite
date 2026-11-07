import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

import { useAuth } from "../context/authContext";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";
import { getMyRestaurant } from "../services/restaurantService";
import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  MenuCategory,
  updateMenuCategory,
} from "../services/menuService";

export default function RestaurantCategoriesScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const { showError } = useErrorFeedback();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    if (!token || user?.role !== "Restaurant") return;
    try {
      const restaurant = await getMyRestaurant(token);
      setRestaurantId(restaurant.restaurantId);
      const all = await getMenuCategories();
      setCategories(all.filter((item) => item.restaurantId === restaurant.restaurantId));
      setError("");
    } catch (err) {
      logAppError("Restaurant categories operation", err);
      showError(getUserFacingError(err, { title: "We couldn't complete this action", message: "Unable to load menu categories.", actionLabel: "Try again" }));
    } finally {
      setLoading(false);
    }
  }, [token, user?.role, showError]);

  useEffect(() => {
    if (!authLoading && user?.role !== "Restaurant") {
      router.replace("/");
      return;
    }
    if (!authLoading && token && user?.role === "Restaurant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the current restaurant's categories.
      void loadCategories();
    }
  }, [authLoading, token, user?.role, loadCategories]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
  }

  function openEdit(category: MenuCategory) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setShowForm(true);
  }

  async function saveCategory() {
    if (!token || !restaurantId) return;
    if (!name.trim()) {
      Alert.alert("Category name required", "Enter a name for this category.");
      return;
    }

    try {
      setSaving(true);
      const payload = { name: name.trim(), description: description.trim() };
      if (editing) {
        await updateMenuCategory(restaurantId, editing.menuCategoryId, payload, token);
      } else {
        await createMenuCategory(restaurantId, payload, token);
      }
      resetForm();
      await loadCategories();
      Alert.alert("Saved", editing ? "Category updated." : "Category created.");
    } catch (err) {
      logAppError("Restaurant categories operation", err);
      showError(getUserFacingError(err, { title: "We couldn't complete this action", message: "We couldn't save your changes. Your information has not been updated. Please try again.", actionLabel: "Try again" }));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(category: MenuCategory) {
    if (!token || !restaurantId) return;
    Alert.alert(
      "Delete category?",
      "Delete " + category.name + "? Menu items in this category may also be affected, so check that it is empty first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMenuCategory(restaurantId, category.menuCategoryId, token);
              await loadCategories();
            } catch (err) {
      logAppError("Restaurant categories operation", err);
      showError(getUserFacingError(err, { title: "We couldn't complete this action", message: "We couldn't remove this item. Nothing was removed. Please try again.", actionLabel: "Try again" }));
    }
          },
        },
      ],
    );
  }

  if (authLoading || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#F97316" /><Text style={styles.muted}>Loading categories...</Text></View>;
  }
  if (!token || user?.role !== "Restaurant") return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Back</Text></Pressable>
        <Text style={styles.heading}>Menu categories</Text>
        <Text style={styles.subheading}>Organise the sections customers see on your menu.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!showForm ? (
          <Pressable style={styles.addButton} onPress={() => { resetForm(); setShowForm(true); }}>
            <Text style={styles.addButtonText}>+ Add category</Text>
          </Pressable>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editing ? "Edit category" : "New category"}</Text>
            <Text style={styles.label}>Category name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Burgers" />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Optional description" multiline textAlignVertical="top" />
            <Pressable style={styles.addButton} onPress={saveCategory} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.addButtonText}>{editing ? "Save category" : "Create category"}</Text>}
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={resetForm} disabled={saving}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        )}

        {categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.muted}>Create categories such as Breakfast, Main Meals, Drinks or Desserts.</Text>
          </View>
        ) : categories.map((category) => (
          <View key={category.menuCategoryId} style={styles.card}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.description ? <Text style={styles.muted}>{category.description}</Text> : null}
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.editButton} onPress={() => openEdit(category)}><Text style={styles.editText}>Edit</Text></Pressable>
              <Pressable style={styles.deleteButton} onPress={() => confirmDelete(category)}><Text style={styles.deleteText}>Delete</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#071B2C", paddingHorizontal: 22, paddingTop: 54, paddingBottom: 24 },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 16 },
  heading: { color: "#FFFFFF", fontSize: 25, fontWeight: "800" },
  subheading: { color: "#CBD5E1", marginTop: 6, lineHeight: 19 },
  content: { width: "100%", maxWidth: 800, alignSelf: "center", padding: 20, paddingBottom: 50 },
  addButton: { backgroundColor: "#F97316", minHeight: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", padding: 12, marginBottom: 16 },
  addButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  form: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: "#E2E8F0" },
  formTitle: { color: "#071B2C", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  label: { color: "#334155", fontWeight: "700", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, padding: 12, color: "#071B2C" },
  multiline: { minHeight: 78, textAlignVertical: "top" },
  cancelButton: { alignItems: "center", padding: 12 },
  cancelText: { color: "#475569", fontWeight: "700" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  categoryInfo: { flex: 1 },
  categoryName: { color: "#071B2C", fontWeight: "800", fontSize: 16, marginBottom: 4 },
  actions: { flexDirection: "row", gap: 8 },
  editButton: { borderWidth: 1, borderColor: "#071B2C", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  editText: { color: "#071B2C", fontWeight: "700" },
  deleteButton: { borderWidth: 1, borderColor: "#DC2626", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deleteText: { color: "#DC2626", fontWeight: "700" },
  empty: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 22, alignItems: "center" },
  emptyTitle: { color: "#071B2C", fontWeight: "800", fontSize: 17, marginBottom: 6 },
  muted: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", padding: 12, borderRadius: 9, marginBottom: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
});
