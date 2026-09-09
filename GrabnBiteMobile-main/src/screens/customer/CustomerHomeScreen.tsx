import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Restaurant } from '../../types';

export const CustomerHomeScreen: React.FC = () => {
  const {
    currentUser,
    selectedAddress,
    restaurants,
    setSelectedRestaurantId,
    setCustomerScreen,
    cartItemCount,
    setCustomerTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = restaurants.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    setCustomerScreen('restaurant-details');
  };

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.deliveryLocationContainer}>
          <Text style={styles.deliveringToLabel}>DELIVERING TO</Text>
          <View style={styles.locationRow}>
            <Icon name="map-pin" size={16} color={THEME.colors.primary} />
            <Text style={styles.locationTitle} numberOfLines={1}>
              {selectedAddress.title} • {selectedAddress.street}
            </Text>
          </View>
        </View>

        {cartItemCount > 0 && (
          <Pressable
            style={styles.cartHeaderButton}
            onPress={() => setCustomerTab('cart')}
          >
            <Icon name="shopping-cart" size={20} color={THEME.colors.primary} />
            <View style={styles.cartHeaderBadge}>
              <Text style={styles.cartHeaderBadgeText}>{cartItemCount}</Text>
            </View>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            Hungry, {currentUser.name.split(' ')[0]}? 🍔
          </Text>
          <Text style={styles.greetingSubtitle}>
            Order from top local restaurants in Cape Town
          </Text>
        </View>

        {/* Simple Restaurant Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, burgers, pizzas..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="x" size={16} color={THEME.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Restaurants</Text>
          <Text style={styles.sectionSubtitle}>
            {filteredRestaurants.length} restaurants available
          </Text>
        </View>

        {/* Restaurant Cards */}
        {filteredRestaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={40} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for "burger", "pizza", or "chicken"
            </Text>
          </View>
        ) : (
          filteredRestaurants.map(restaurant => (
            <Pressable
              key={restaurant.id}
              style={({ pressed }) => [
                styles.restaurantCard,
                pressed && styles.restaurantCardPressed,
              ]}
              onPress={() => handleSelectRestaurant(restaurant)}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: restaurant.image }}
                  style={styles.restaurantImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlayBadge}>
                  <Badge
                    label={restaurant.isOpen ? 'OPEN NOW' : 'CLOSED'}
                    variant={restaurant.isOpen ? 'success' : 'danger'}
                  />
                </View>
                <View style={styles.timeBadge}>
                  <Icon name="clock" size={12} color="#FFFFFF" />
                  <Text style={styles.timeBadgeText}>{restaurant.deliveryTime}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Icon name="star" size={14} color={THEME.colors.star} />
                    <Text style={styles.ratingText}>
                      {restaurant.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewCountText}>
                      ({restaurant.reviewCount})
                    </Text>
                  </View>
                </View>

                <Text style={styles.restaurantDescription} numberOfLines={2}>
                  {restaurant.description}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.deliveryFeeRow}>
                    <Icon name="truck" size={14} color={THEME.colors.textMuted} />
                    <Text style={styles.deliveryFeeText}>
                      R{restaurant.deliveryFee} delivery fee • Min R{restaurant.minOrder}
                    </Text>
                  </View>

                  <View style={styles.categoryPills}>
                    {restaurant.categories.slice(0, 2).map((cat, idx) => (
                      <View key={idx} style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  deliveryLocationContainer: {
    flex: 1,
    marginRight: THEME.spacing.md,
  },
  deliveringToLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  cartHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartHeaderBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: THEME.colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  greetingSection: {
    marginBottom: THEME.spacing.md,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    outlineStyle: 'none' as any,
  },
  sectionHeader: {
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  restaurantCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    overflow: 'hidden',
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  restaurantCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  imageWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    padding: THEME.spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  reviewCountText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  restaurantDescription: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.sm,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryFeeText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  categoryPills: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryChip: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  categoryChipText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
