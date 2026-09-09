import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { MenuItem } from '../../types';

export const RestaurantMenuScreen: React.FC = () => {
  const {
    currentUser,
    restaurants,
    menuItems,
    toggleItemAvailability,
    addMenuItem,
    updateMenuItem,
  } = useApp();

  const myRestaurant =
    restaurants.find(r => r.id === currentUser.restaurantId) || restaurants[0];

  const items = menuItems.filter(
    item => item.restaurantId === myRestaurant.id || !item.restaurantId
  );

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory(myRestaurant.categories[0] || 'Burgers');
    setImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80');
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCategory(item.category);
    setImage(item.image);
    setModalVisible(true);
  };

  const handleSave = () => {
    const numPrice = parseFloat(price) || 0;
    if (!name.trim() || numPrice <= 0) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        category: category.trim() || 'General',
        image: image || editingItem.image,
      });
    } else {
      addMenuItem({
        restaurantId: myRestaurant.id,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        category: category.trim() || 'General',
        image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
        isAvailable: true,
      });
    }

    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Menu Management"
        subtitle={`${myRestaurant.name} • ${items.length} items`}
        rightAction={
          <Pressable onPress={openAddModal} style={styles.addIconBtn}>
            <Icon name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topInfoBar}>
          <Text style={styles.topInfoText}>
            Toggle switches below to mark items available or sold out.
          </Text>
        </View>

        {items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemThumbnail}
            />

            <View style={styles.itemDetails}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>

              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemPrice}>R{item.price.toFixed(2)}</Text>

              <View style={styles.availabilityRow}>
                <Text
                  style={[
                    styles.availabilityLabel,
                    item.isAvailable ? styles.labelAvailable : styles.labelSoldOut,
                  ]}
                >
                  {item.isAvailable ? 'Available' : 'Sold Out'}
                </Text>

                <Switch
                  value={item.isAvailable}
                  onValueChange={() => toggleItemAvailability(item.id)}
                  trackColor={{
                    false: THEME.colors.border,
                    true: THEME.colors.success,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Pressable
              style={styles.editButton}
              onPress={() => openEditModal(item)}
              hitSlop={8}
            >
              <Icon name="edit" size={18} color={THEME.colors.textMuted} />
            </Pressable>
          </View>
        ))}

        {/* Big Add Item Primary Button at Bottom */}
        <Button
          title="+ Add New Menu Item"
          onPress={openAddModal}
          variant="outline"
          size="lg"
          style={styles.bottomAddBtn}
        />
      </ScrollView>

      {/* Add / Edit Item Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Icon name="x" size={20} color={THEME.colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dish Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Bacon Cheddar Melt"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Burgers, Sides, Drinks..."
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (in Rands)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 95"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Ingredients and description"
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <Button
                title={editingItem ? 'Save Changes' : 'Create Menu Item'}
                onPress={handleSave}
                size="lg"
                style={styles.modalSaveBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  addIconBtn: {
    backgroundColor: THEME.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  topInfoBar: {
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.md,
    borderRadius: THEME.radii.sm,
    marginBottom: THEME.spacing.md,
  },
  topInfoText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  itemThumbnail: {
    width: 72,
    height: 72,
    borderRadius: THEME.radii.sm,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  itemCategory: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelAvailable: {
    color: THEME.colors.success,
  },
  labelSoldOut: {
    color: THEME.colors.danger,
  },
  editButton: {
    padding: 8,
  },
  bottomAddBtn: {
    marginTop: THEME.spacing.md,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radii.lg,
    borderTopRightRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    maxHeight: '85%',
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    outlineStyle: 'none' as any,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalSaveBtn: {
    marginTop: THEME.spacing.md,
    marginBottom: 10,
  },
});
