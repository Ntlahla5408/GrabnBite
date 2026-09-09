import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { OrderStatusBadge } from '../../components/common/Badge';

export const DriverHomeScreen: React.FC = () => {
  const {
    currentDriver,
    toggleDriverOnline,
    orders,
    setDriverTab,
  } = useApp();

  // Find active delivery assigned to this driver
  const activeDelivery = orders.find(
    o =>
      (o.driverId === currentDriver.id || !o.driverId) &&
      (o.status === 'ready_for_pickup' ||
        o.status === 'picking_up' ||
        o.status === 'on_the_way')
  );

  return (
    <View style={styles.container}>
      <Header
        title="Driver Portal"
        subtitle={`Welcome, ${currentDriver.name}`}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Online / Offline Status Toggle Card */}
        <View style={styles.onlineCard}>
          <View style={styles.onlineInfo}>
            <View style={styles.onlineDotRow}>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: currentDriver.isOnline
                      ? THEME.colors.success
                      : THEME.colors.danger,
                  },
                ]}
              />
              <Text style={styles.onlineTitle}>
                {currentDriver.isOnline ? "You're online" : "You're offline"}
              </Text>
            </View>
            <Text style={styles.onlineSub}>
              {currentDriver.isOnline
                ? 'Ready to receive delivery requests in Cape Town.'
                : 'Switch online to start receiving order dispatches.'}
            </Text>
          </View>

          <Switch
            value={currentDriver.isOnline}
            onValueChange={toggleDriverOnline}
            trackColor={{ false: THEME.colors.border, true: THEME.colors.success }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Vehicle and Stats Summary */}
        <View style={styles.driverInfoCard}>
          <View style={styles.vehicleRow}>
            <Icon name="truck" size={18} color={THEME.colors.primary} />
            <Text style={styles.vehicleText}>{currentDriver.vehicle}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{currentDriver.rating} ★</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{currentDriver.totalDeliveries}</Text>
              <Text style={styles.statLbl}>Deliveries</Text>
            </View>
          </View>
        </View>

        {/* Delivery State Section */}
        {currentDriver.isOnline ? (
          activeDelivery ? (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryCardHeader}>
                <View>
                  <Text style={styles.activeDeliveryTitle}>Active Delivery</Text>
                  <Text style={styles.orderNumberText}>{activeDelivery.orderNumber}</Text>
                </View>
                <OrderStatusBadge status={activeDelivery.status} />
              </View>

              {/* Pickup Information */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconWrapper}>
                  <Icon name="store" size={16} color={THEME.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoRoleLabel}>PICKUP FROM</Text>
                  <Text style={styles.infoMainText}>{activeDelivery.restaurantName}</Text>
                  <Text style={styles.infoSubText}>{activeDelivery.restaurantAddress}</Text>
                </View>
              </View>

              {/* Delivery Information */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconWrapperGreen}>
                  <Icon name="map-pin" size={16} color={THEME.colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoRoleLabel}>DELIVER TO</Text>
                  <Text style={styles.infoMainText}>{activeDelivery.customerName}</Text>
                  <Text style={styles.infoSubText}>
                    {activeDelivery.deliveryAddress.street}, {activeDelivery.deliveryAddress.city}
                  </Text>
                </View>
              </View>

              {/* Items & Payout */}
              <View style={styles.payoutRow}>
                <Text style={styles.itemsCount}>
                  {activeDelivery.items.reduce((s, i) => s + i.quantity, 0)} items • R{activeDelivery.total.toFixed(2)}
                </Text>
                <Text style={styles.earningsText}>Est. Earnings: R35.00</Text>
              </View>

              {/* Primary Action Button */}
              <Button
                title="View Delivery"
                onPress={() => setDriverTab('delivery')}
                size="lg"
                icon={<Icon name="navigation" size={18} color="#FFFFFF" />}
              />
            </View>
          ) : (
            <View style={styles.idleCard}>
              <View style={styles.idleRadar}>
                <Icon name="compass" size={40} color={THEME.colors.primary} />
              </View>
              <Text style={styles.idleTitle}>You're online</Text>
              <Text style={styles.idleSubtitle}>
                Waiting for a delivery... We'll notify you as soon as an order is ready for dispatch.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.offlinePromptCard}>
            <Icon name="alert-circle" size={36} color={THEME.colors.textMuted} />
            <Text style={styles.offlinePromptTitle}>You are currently offline</Text>
            <Text style={styles.offlinePromptSub}>
              Turn your online toggle ON above to receive delivery assignments.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  onlineInfo: {
    flex: 1,
    marginRight: 16,
  },
  onlineDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  onlineSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  driverInfoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: THEME.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: THEME.colors.borderLight,
  },
  deliveryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.md,
  },
  activeDeliveryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  orderNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  infoBlock: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    gap: 12,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconWrapperGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoRoleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  infoMainText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  infoSubText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  itemsCount: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  earningsText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  idleCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  idleRadar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  idleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  idleSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 260,
  },
  offlinePromptCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  offlinePromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  offlinePromptSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
