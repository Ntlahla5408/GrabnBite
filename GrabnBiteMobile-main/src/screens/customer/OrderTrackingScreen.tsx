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
import { LiveMap } from '../../components/common/LiveMap';
import { Icon } from '../../components/common/Icon';
import { OrderStatus } from '../../types';

export const OrderTrackingScreen: React.FC = () => {
  const {
    orders,
    trackingOrderId,
    setCustomerScreen,
    setCustomerTab,
    startDelivery,
    completeDelivery,
  } = useApp();

  const currentOrder =
    orders.find(o => o.id === trackingOrderId) ||
    orders.find(o => o.status !== 'delivered') ||
    orders[0];

  if (!currentOrder) {
    return (
      <View style={styles.container}>
        <Header title="Track Order" showBack onBack={() => setCustomerScreen('tabs')} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active orders to track.</Text>
        </View>
      </View>
    );
  }

  const timelineSteps: { key: OrderStatus; label: string }[] = [
    { key: 'placed', label: 'Order placed' },
    { key: 'accepted', label: 'Restaurant accepted' },
    { key: 'preparing', label: 'Preparing food' },
    { key: 'picking_up', label: 'Driver picking up' },
    { key: 'on_the_way', label: 'On the way' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const statusOrder: Record<OrderStatus, number> = {
    placed: 0,
    accepted: 1,
    preparing: 2,
    ready_for_pickup: 2.5,
    picking_up: 3,
    on_the_way: 4,
    delivered: 5,
    cancelled: -1,
  };

  const currentStepIndex = statusOrder[currentOrder.status] ?? 0;
  const hasDriver =
    currentOrder.driverName &&
    (currentOrder.status === 'picking_up' ||
      currentOrder.status === 'on_the_way' ||
      currentOrder.status === 'delivered');

  return (
    <View style={styles.container}>
      <Header
        title={`Tracking ${currentOrder.orderNumber}`}
        subtitle={currentOrder.restaurantName}
        showBack
        onBack={() => {
          setCustomerScreen('tabs');
          setCustomerTab('orders');
        }}
        rightAction={
          <Pressable
            onPress={() => {
              setCustomerScreen('tabs');
              setCustomerTab('orders');
            }}
            hitSlop={8}
          >
            <Icon name="x" size={22} color={THEME.colors.textPrimary} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Map or Preparation Stage Card */}
        {hasDriver ? (
          <View style={styles.mapSection}>
            <LiveMap
              restaurantName={currentOrder.restaurantName}
              customerAddress={currentOrder.deliveryAddress.street}
              driverName={currentOrder.driverName}
              driverVehicle={currentOrder.driverVehicle}
              driverProgress={currentOrder.driverProgress ?? 0.65}
              height={230}
            />

            {/* Driver Information Card */}
            <View style={styles.driverCard}>
              <View style={styles.driverLeft}>
                {currentOrder.driverAvatar ? (
                  <Image
                    source={{ uri: currentOrder.driverAvatar }}
                    style={styles.driverAvatar}
                  />
                ) : (
                  <View style={styles.driverAvatarPlaceholder}>
                    <Icon name="user" size={24} color={THEME.colors.primary} />
                  </View>
                )}
                <View style={styles.driverDetails}>
                  <Text style={styles.driverArrivalNotice}>
                    {currentOrder.status === 'delivered'
                      ? 'Order delivered!'
                      : 'Your driver is on the way'}
                  </Text>
                  <Text style={styles.driverName}>{currentOrder.driverName}</Text>
                  <View style={styles.driverMetaRow}>
                    <Icon name="star" size={12} color={THEME.colors.star} />
                    <Text style={styles.driverRating}>
                      {currentOrder.driverRating?.toFixed(1) || '4.9'}
                    </Text>
                    <Text style={styles.driverVehicle}>
                      • {currentOrder.driverVehicle}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.driverActions}>
                <View style={styles.driverCallButton}>
                  <Icon name="phone" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.kitchenPrepCard}>
            <View style={styles.kitchenIconCircle}>
              <Icon name="store" size={32} color={THEME.colors.primary} />
            </View>
            <Text style={styles.kitchenTitle}>
              {currentOrder.status === 'placed'
                ? 'Order Placed with Restaurant'
                : 'Kitchen is Preparing your Food'}
            </Text>
            <Text style={styles.kitchenSubtitle}>
              {currentOrder.restaurantName} is carefully preparing your meal fresh. A driver will be assigned soon.
            </Text>
            <View style={styles.estTimeBadge}>
              <Icon name="clock" size={14} color={THEME.colors.primary} />
              <Text style={styles.estTimeText}>
                Estimated Arrival: {currentOrder.estimatedDeliveryTime}
              </Text>
            </View>
          </View>
        )}

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>Delivery Timeline</Text>

          <View style={styles.timelineList}>
            {timelineSteps.map((step, idx) => {
              const stepRank = statusOrder[step.key];
              const isCompleted = currentStepIndex > stepRank;
              const isCurrent =
                currentStepIndex === stepRank ||
                (step.key === 'preparing' && currentOrder.status === 'ready_for_pickup');

              return (
                <View key={step.key} style={styles.timelineRow}>
                  {/* Indicator Column */}
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isCompleted && styles.dotCompleted,
                        isCurrent && styles.dotCurrent,
                        !isCompleted && !isCurrent && styles.dotPending,
                      ]}
                    >
                      {isCompleted ? (
                        <Icon name="check" size={12} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <View style={styles.innerActiveDot} />
                      ) : null}
                    </View>
                    {idx < timelineSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineConnector,
                          isCompleted && styles.connectorCompleted,
                        ]}
                      />
                    )}
                  </View>

                  {/* Label Column */}
                  <View style={styles.timelineLabelCol}>
                    <Text
                      style={[
                        styles.timelineStepLabel,
                        isCompleted && styles.labelCompleted,
                        isCurrent && styles.labelCurrent,
                        !isCompleted && !isCurrent && styles.labelPending,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.currentStepSubtext}>
                        {step.key === 'placed' && 'Order sent to restaurant'}
                        {step.key === 'accepted' && 'Restaurant confirmed receipt'}
                        {step.key === 'preparing' && 'Dishes are being cooked'}
                        {step.key === 'picking_up' && 'Driver heading to restaurant'}
                        {step.key === 'on_the_way' && 'Live GPS tracking active'}
                        {step.key === 'delivered' && 'Enjoy your meal!'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Details Accordion */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery To</Text>
            <Text style={styles.detailValue}>
              {currentOrder.deliveryAddress.title} ({currentOrder.deliveryAddress.street})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{currentOrder.paymentMethod}</Text>
          </View>

          <View style={styles.orderItemsList}>
            {currentOrder.items.map((item, index) => (
              <View key={index} style={styles.orderItemSummaryRow}>
                <Text style={styles.itemCountText}>{item.quantity}x</Text>
                <Text style={styles.orderItemNameText}>{item.name}</Text>
                <Text style={styles.orderItemPriceText}>
                  R{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Paid</Text>
            <Text style={styles.summaryTotalValue}>R{currentOrder.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  mapSection: {
    marginBottom: THEME.spacing.md,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverArrivalNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  driverVehicle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  driverActions: {
    flexDirection: 'row',
  },
  driverCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenPrepCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  kitchenIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  kitchenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  kitchenSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  estTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    gap: 6,
  },
  estTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  timelineCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  timelineHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  dotCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: THEME.colors.primary,
  },
  innerActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
  },
  dotPending: {
    backgroundColor: '#FFFFFF',
    borderColor: THEME.colors.border,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 2,
  },
  connectorCompleted: {
    backgroundColor: THEME.colors.success,
  },
  timelineLabelCol: {
    flex: 1,
    paddingTop: 1,
    paddingBottom: 12,
  },
  timelineStepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelCompleted: {
    color: THEME.colors.textPrimary,
  },
  labelCurrent: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  labelPending: {
    color: THEME.colors.textMuted,
  },
  currentStepSubtext: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  orderItemsList: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  orderItemSummaryRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
    width: 24,
  },
  orderItemNameText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  orderItemPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.colors.textMuted,
  },
});
