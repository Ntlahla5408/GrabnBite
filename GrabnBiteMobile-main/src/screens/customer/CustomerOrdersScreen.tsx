import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Order } from '../../types';

export const CustomerOrdersScreen: React.FC = () => {
  const { orders, setTrackingOrderId, setSelectedOrderDetailsId, setCustomerScreen } = useApp();
  const [filterTab, setFilterTab] = useState<'active' | 'past'>('active');

  const activeOrders = orders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  const pastOrders = orders.filter(
    o => o.status === 'delivered' || o.status === 'cancelled'
  );

  const displayedOrders = filterTab === 'active' ? activeOrders : pastOrders;

  const handleTrackOrder = (order: Order) => {
    setTrackingOrderId(order.id);
    setCustomerScreen('order-tracking');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrderDetailsId(order.id);
    setCustomerScreen('order-details');
  };

  return (
    <View style={styles.container}>
      <Header title="My Orders" />

      {/* Segmented Filter Control */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[
            styles.segmentButton,
            filterTab === 'active' && styles.segmentButtonActive,
          ]}
          onPress={() => setFilterTab('active')}
        >
          <Text
            style={[
              styles.segmentText,
              filterTab === 'active' && styles.segmentTextActive,
            ]}
          >
            ACTIVE ORDERS ({activeOrders.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            filterTab === 'past' && styles.segmentButtonActive,
          ]}
          onPress={() => setFilterTab('past')}
        >
          <Text
            style={[
              styles.segmentText,
              filterTab === 'past' && styles.segmentTextActive,
            ]}
          >
            PAST ORDERS ({pastOrders.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="package" size={40} color={THEME.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filterTab === 'active' ? 'No active orders' : 'No past orders yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filterTab === 'active'
                ? 'When you place an order, you can track it live here.'
                : 'Your delivered orders will appear here.'}
            </Text>
          </View>
        ) : (
          displayedOrders.map(order => {
            const isActive = filterTab === 'active';

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Top card row */}
                <View style={styles.orderHeaderRow}>
                  <View style={styles.restaurantMeta}>
                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                    <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
                  </View>
                  <OrderStatusBadge status={order.status} />
                </View>

                {/* Items summary */}
                <View style={styles.orderItemsSection}>
                  <Text style={styles.orderItemsText} numberOfLines={2}>
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                  </Text>
                  <Text style={styles.orderDateText}>{order.createdAt}</Text>
                </View>

                {/* Bottom row: Total & Primary Action Button */}
                <View style={styles.orderFooterRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>R{order.total.toFixed(2)}</Text>
                  </View>

                  {isActive ? (
                    <Button
                      title="Track Order"
                      onPress={() => handleTrackOrder(order)}
                      size="sm"
                      style={styles.actionButton}
                      icon={<Icon name="navigation" size={14} color="#FFFFFF" />}
                    />
                  ) : (
                    <Button
                      title="View Order"
                      onPress={() => handleViewOrder(order)}
                      variant="outline"
                      size="sm"
                      style={styles.actionButton}
                    />
                  )}
                </View>
              </View>
            );
          })
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.radii.sm,
  },
  segmentButtonActive: {
    backgroundColor: THEME.colors.primaryLight,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: THEME.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  restaurantMeta: {
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  orderItemsSection: {
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.borderLight,
    marginVertical: 4,
  },
  orderItemsText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  orderDateText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  totalLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  actionButton: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
