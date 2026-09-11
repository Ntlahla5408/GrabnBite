import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';

export const CartScreen: React.FC = () => {
  const {
    cart,
    cartRestaurant,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    customerScreen,
    setCustomerScreen,
    setCustomerTab,
  } = useApp();

  // Helper for clean Rand display matching prompt specifications (e.g., R75, R150, R205)
  const formatRand = (val: number) => {
    return val % 1 === 0 ? `R${val}` : `R${val.toFixed(2)}`;
  };

  if (cart.length === 0 || !cartRestaurant) {
    return (
      <View style={styles.container}>
        <Header
          title="Your Cart"
          showBack={customerScreen === 'cart'}
          onBack={() => {
            setCustomerScreen('tabs');
            setCustomerTab('home');
          }}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shopping-cart" size={48} color={THEME.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>
          <Text style={styles.emptySubtitle}>
            Browse our popular restaurants and add your favorite dishes!
          </Text>
          <Button
            title="Browse Restaurants"
            onPress={() => {
              setCustomerScreen('tabs');
              setCustomerTab('home');
            }}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Your Cart"
        showBack={customerScreen === 'cart'}
        onBack={() => {
          setCustomerScreen('tabs');
          setCustomerTab('home');
        }}
        rightAction={
          <Pressable onPress={clearCart} hitSlop={8} accessibilityLabel="Clear cart">
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Header */}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantIcon}>
            <Icon name="store" size={20} color={THEME.colors.primary} />
          </View>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{cartRestaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{cartRestaurant.address}</Text>
          </View>
        </View>

        {/* Cart Items List */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionHeading}>Order Items</Text>

          {cart.map(item => (
            <View key={item.menuItem.id} style={styles.cartItemRow}>
              <Image
                source={{ uri: item.menuItem.image }}
                style={styles.itemThumbnail}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                <Text style={styles.itemUnitPrice}>
                  {formatRand(item.menuItem.price)} each
                </Text>
              </View>

              {/* Quantity Controls */}
              <View style={styles.quantityControls}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateCartQuantity(item.menuItem.id, -1)}
                  hitSlop={6}
                  accessibilityLabel="Decrease quantity"
                >
                  <Icon name="minus" size={14} color={THEME.colors.textPrimary} />
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateCartQuantity(item.menuItem.id, 1)}
                  hitSlop={6}
                  accessibilityLabel="Increase quantity"
                >
                  <Icon name="plus" size={14} color={THEME.colors.textPrimary} />
                </Pressable>
              </View>

              <Text style={styles.itemTotal}>
                {formatRand(item.menuItem.price * item.quantity)}
              </Text>

              <Pressable
                style={styles.removeItemBtn}
                onPress={() => removeFromCart(item.menuItem.id)}
                hitSlop={8}
                accessibilityLabel={`Remove ${item.menuItem.name}`}
              >
                <Icon name="x" size={14} color={THEME.colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Cost Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionHeading}>Payment Summary</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>{formatRand(cartSubtotal)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery Fee</Text>
            <Text style={styles.breakdownValue}>{formatRand(cartDeliveryFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRand(cartTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Primary Action Button */}
      <View style={styles.footerContainer}>
        <Button
          title={`Proceed to Checkout • ${formatRand(cartTotal)}`}
          onPress={() => setCustomerScreen('checkout')}
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 20,
  },
  clearText: {
    color: THEME.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  restaurantAddress: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  itemsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: THEME.radii.sm,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 12,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    paddingHorizontal: 8,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    minWidth: 50,
    textAlign: 'right',
  },
  removeItemBtn: {
    padding: 6,
    marginLeft: 8,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginVertical: THEME.spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  footerContainer: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    ...THEME.shadows.bottomBar,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xxl,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: THEME.spacing.xl,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 200,
  },
});
