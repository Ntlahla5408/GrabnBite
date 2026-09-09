import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MenuItem } from '../../types';

export const RestaurantDetailsScreen: React.FC = () => {
  const {
    selectedRestaurantId,
    restaurants,
    menuItems,
    cart,
    cartRestaurant,
    addToCart,
    clearAndAddToCart,
    updateCartQuantity,
    setCustomerScreen,
    setCustomerTab,
    cartTotal,
    cartItemCount,
  } = useApp();

  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);

  const restaurant =
    restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];

  const restaurantItems = menuItems.filter(
    item => item.restaurantId === restaurant.id
  );

  // Extract unique categories
  const categories = Array.from(
    new Set(restaurantItems.map(item => item.category))
  );

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] || 'All'
  );

  const displayedItems =
    selectedCategory === 'All'
      ? restaurantItems
      : restaurantItems.filter(item => item.category === selectedCategory);

  const getItemQuantityInCart = (itemId: string) => {
    const item = cart.find(ci => ci.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const handleAddItem = (item: MenuItem) => {
    if (cart.length > 0 && cartRestaurant && cartRestaurant.id !== restaurant.id) {
      setConflictItem(item);
    } else {
      addToCart(item);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header with back button */}
      <View style={styles.navHeader}>
        <Pressable
          style={styles.backButton}
          onPress={() => setCustomerScreen('tabs')}
        >
          <Icon name="chevron-left" size={24} color={THEME.colors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image */}
        <View style={styles.bannerWrapper}>
          <Image
            source={{ uri: restaurant.bannerImage }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Badge
              label={restaurant.isOpen ? 'OPEN NOW' : 'CLOSED'}
              variant={restaurant.isOpen ? 'success' : 'danger'}
              size="md"
            />
          </View>
        </View>

        {/* Restaurant Info Header */}
        <View style={styles.infoCard}>
          <Text style={styles.restaurantTitle}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>{restaurant.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="star" size={16} color={THEME.colors.star} />
              <Text style={styles.metaTextBold}>
                {restaurant.rating.toFixed(1)}
              </Text>
              <Text style={styles.metaTextMuted}>
                ({restaurant.reviewCount} reviews)
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Icon name="clock" size={16} color={THEME.colors.textMuted} />
              <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Icon name="truck" size={16} color={THEME.colors.textMuted} />
              <Text style={styles.metaText}>R{restaurant.deliveryFee} Fee</Text>
            </View>
          </View>
        </View>

        {/* Category Pills Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryBarContent}
        >
          <Pressable
            style={[
              styles.categoryTab,
              selectedCategory === 'All' && styles.activeCategoryTab,
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === 'All' && styles.activeCategoryTabText,
              ]}
            >
              All Items
            </Text>
          </Pressable>

          {categories.map(cat => (
            <Pressable
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && styles.activeCategoryTab,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === cat && styles.activeCategoryTabText,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items List */}
        <View style={styles.menuSection}>
          <Text style={styles.categoryHeading}>
            {selectedCategory === 'All' ? 'Full Menu' : selectedCategory}
          </Text>

          {displayedItems.map(item => {
            const qty = getItemQuantityInCart(item.id);

            return (
              <View key={item.id} style={styles.menuItemCard}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                  <Text style={styles.menuItemPrice}>R{item.price.toFixed(2)}</Text>

                  {/* Add / Quantity Controls */}
                  <View style={styles.actionRow}>
                    {qty === 0 ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.addButton,
                          pressed && styles.addButtonPressed,
                        ]}
                        onPress={() => handleAddItem(item)}
                      >
                        <Icon name="plus" size={16} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>ADD</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.quantityControl}>
                        <Pressable
                          style={styles.qtyButton}
                          onPress={() => updateCartQuantity(item.id, -1)}
                        >
                          <Icon name="minus" size={14} color={THEME.colors.primary} />
                        </Pressable>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <Pressable
                          style={styles.qtyButton}
                          onPress={() => updateCartQuantity(item.id, 1)}
                        >
                          <Icon name="plus" size={14} color={THEME.colors.primary} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.menuItemRight}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.menuItemImage}
                    resizeMode="cover"
                  />
                  {item.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Primary Floating Action Bar: Proceed to Cart */}
      {cartItemCount > 0 && (
        <View style={styles.floatingCartBar}>
          <Pressable
            style={styles.floatingCartInner}
            onPress={() => {
              setCustomerScreen('tabs');
              setCustomerTab('cart');
            }}
          >
            <View style={styles.floatingCartCount}>
              <Text style={styles.floatingCartCountText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>View Cart</Text>
            <Text style={styles.floatingCartTotal}>R{cartTotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}

      {/* Switch Restaurant / Conflict Confirmation Modal */}
      <Modal
        visible={!!conflictItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConflictItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Icon name="store" size={26} color={THEME.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Start new cart?</Text>
            <Text style={styles.modalBody}>
              Your cart contains items from{' '}
              <Text style={styles.modalHighlight}>{cartRestaurant?.name}</Text>. Clear your
              cart to add items from{' '}
              <Text style={styles.modalHighlight}>{restaurant.name}</Text>?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setConflictItem(null)}
              >
                <Text style={styles.modalCancelText}>Keep Current Cart</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => {
                  if (conflictItem) {
                    clearAndAddToCart(conflictItem);
                    setConflictItem(null);
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Clear & Start New</Text>
              </Pressable>
            </View>
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    height: 56,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRightSpace: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bannerWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  restaurantTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  restaurantDescription: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.sm,
    borderRadius: THEME.radii.md,
    justifyContent: 'space-around',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  metaTextMuted: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: THEME.colors.border,
  },
  categoryBar: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  categoryBarContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radii.full,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  activeCategoryTab: {
    backgroundColor: THEME.colors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  activeCategoryTabText: {
    color: '#FFFFFF',
  },
  menuSection: {
    padding: THEME.spacing.lg,
  },
  categoryHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  menuItemLeft: {
    flex: 1,
    paddingRight: THEME.spacing.md,
    justifyContent: 'space-between',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.radii.full,
    gap: 4,
  },
  addButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: THEME.radii.full,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
    minWidth: 16,
    textAlign: 'center',
  },
  menuItemRight: {
    width: 96,
    height: 96,
    borderRadius: THEME.radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: THEME.colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...THEME.shadows.modal,
  },
  floatingCartCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCountText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  floatingCartLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  floatingCartTotal: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.modal,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.spacing.lg,
  },
  modalHighlight: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
