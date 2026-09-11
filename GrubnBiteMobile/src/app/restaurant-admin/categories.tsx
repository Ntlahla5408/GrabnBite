import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  createCategory,
  deleteCategory,
  getCategories,
  MenuCategory,
  updateCategory,
} from "@/services/restaurantAdminService";

export default function RestaurantCategoriesScreen() {
  const [categories, setCategories] = useState<MenuCategory[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<MenuCategory | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      setCategories(result);
    } catch (err) {
      console.error(err);

      Alert.alert(
        "Unable to load categories",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, []),
  );

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setModalVisible(true);
  };

  const saveCategory = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Missing name",
        "Please enter a category name.",
      );
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        const updated = await updateCategory(
          editingCategory.id,
          {
            name: name.trim(),
            description: description.trim(),
          },
        );

        setCategories((current) =>
          current.map((category) =>
            category.id === editingCategory.id
              ? updated
              : category,
          ),
        );
      } else {
        const created = await createCategory({
          name: name.trim(),
          description: description.trim(),
        });

        setCategories((current) => [
          ...current,
          created,
        ]);
      }

      setModalVisible(false);
      resetForm();
    } catch (err) {
      Alert.alert(
        "Unable to save category",
        err instanceof Error
          ? err.message
          : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = (category: MenuCategory) => {
    Alert.alert(
      "Delete category",
      `Delete "${category.name}"? Menu items using this category may prevent deletion.`,
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
              await deleteCategory(category.id);

              setCategories((current) =>
                current.filter(
                  (item) => item.id !== category.id,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Delete failed",
                err instanceof Error
                  ? err.message
                  : "Unable to delete category.",
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
        <Text style={styles.loading}>
          Loading categories...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Categories
            </Text>

            <Text style={styles.subtitle}>
              Organise your restaurant menu.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={openAdd}
          >
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏷️</Text>

            <Text style={styles.emptyTitle}>
              No categories yet
            </Text>

            <Text style={styles.emptyText}>
              Create categories such as Burgers, Drinks,
              Meals or Desserts.
            </Text>
          </View>
        ) : (
          categories.map((category) => (
            <View
              key={category.id}
              style={styles.card}
            >
              <View style={styles.icon}>
                <Text>🏷️</Text>
              </View>

              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>
                  {category.name}
                </Text>

                <Text style={styles.description}>
                  {category.description ||
                    "No description"}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => openEdit(category)}
                >
                  <Text style={styles.edit}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    removeCategory(category)
                  }
                >
                  <Text style={styles.delete}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory
                  ? "Edit Category"
                  : "Add Category"}
              </Text>

              <Pressable
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={styles.close}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>
              Category Name
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Burgers"
            />

            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the category"
              multiline
            />

            <Pressable
              style={styles.saveButton}
              onPress={saveCategory}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>
                  {editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#071B2C",
  },

  subtitle: {
    marginTop: 5,
    color: "#64748B",
  },

  addButton: {
    backgroundColor: "#071B2C",
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  addText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#071B2C",
  },

  description: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },

  actions: {
    gap: 8,
    alignItems: "flex-end",
  },

  edit: {
    color: "#2C7A9E",
    fontWeight: "700",
    fontSize: 12,
  },

  delete: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 12,
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 35,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: "800",
    color: "#071B2C",
  },

  emptyText: {
    marginTop: 7,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 20,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#071B2C",
  },

  close: {
    fontSize: 20,
    color: "#64748B",
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 16,
    color: "#071B2C",
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  saveButton: {
    backgroundColor: "#071B2C",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loading: {
    marginTop: 10,
    color: "#64748B",
  },
});