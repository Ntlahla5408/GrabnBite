import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { LiveMap } from '../../components/common/LiveMap';
import { OrderStatusBadge } from '../../components/common/Badge';
import {
  Truck,
  Store,
  MapPin,
  CheckCircle,
  Navigation,
  Send,
  AlertCircle,
  Check,
  Package,
} from 'lucide-react';

export const DriverDeliveryScreen: React.FC = () => {
  const {
    currentDriver,
    orders,
    acceptDelivery,
    confirmPickup,
    startDelivery,
    sendLiveLocation,
    completeDelivery,
    setDriverTab,
  } = useApp();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Find active delivery assigned to this driver
  const activeDelivery =
    orders.find(
      o =>
        (o.driverId === currentDriver.id || !o.driverId) &&
        (o.status === 'ready_for_pickup' ||
          o.status === 'picking_up' ||
          o.status === 'on_the_way')
    ) || orders.find(o => o.status === 'delivered');

  if (!activeDelivery) {
    return (
      <View style={styles.container}>
        <Header title="Delivery Active" />
        <View style={styles.emptyContainer}>
          <Truck size={48} color={THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No active delivery assigned</Text>
          <Text style={styles.emptySubtitle}>
            When an order is assigned to you by Dispatch, full route guidance and actions will appear here.
          </Text>
          <Button
            title="Go to Driver Home"
            onPress={() => setDriverTab('home')}
            style={styles.emptyBtn}
          />
        </View>
      </View>
    );
  }

  // Determine current delivery step state
  const isAssigned = activeDelivery.status === 'ready_for_pickup' && activeDelivery.driverId;
  const isAccepted = activeDelivery.status === 'picking_up' && (activeDelivery.driverProgress || 0) < 0.2;
  const isPickedUp = activeDelivery.status === 'picking_up' && (activeDelivery.driverProgress || 0) >= 0.2;
  const isDelivering = activeDelivery.status === 'on_the_way';
  const isDelivered = activeDelivery.status === 'delivered';

  return (
    <View style={styles.container}>
      <Header
        title={`Delivery ${activeDelivery.orderNumber}`}
        subtitle={`${activeDelivery.restaurantName} ➔ ${activeDelivery.customerName}`}
        rightAction={<OrderStatusBadge status={activeDelivery.status} />}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live GPS Map */}
        <View style={styles.mapContainer}>
          <LiveMap
            restaurantName={activeDelivery.restaurantName}
            customerAddress={activeDelivery.deliveryAddress.street}
            driverName={currentDriver.name}
            driverVehicle={currentDriver.vehicle}
            driverProgress={activeDelivery.driverProgress ?? 0.4}
            height={210}
          />
        </View>

        {/* Overview Box: Pickup, Dropoff, Earnings */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.iconCirclePrimary}>
              <Store size={16} color={THEME.colors.primary} />
            </View>
            <View style={styles.summaryTextCol}>
              <Text style={styles.summaryLabel}>PICKUP</Text>
              <Text style={styles.summaryValue}>{activeDelivery.restaurantName}</Text>
              <Text style={styles.summarySub}>{activeDelivery.restaurantAddress}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.iconCircleSuccess}>
              <MapPin size={16} color={THEME.colors.success} />
            </View>
            <View style={styles.summaryTextCol}>
              <Text style={styles.summaryLabel}>DROPOFF</Text>
              <Text style={styles.summaryValue}>
                {activeDelivery.deliveryAddress.street}, {activeDelivery.deliveryAddress.city}
              </Text>
              <Text style={styles.summarySub}>Customer: {activeDelivery.customerName}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Driver Delivery Payout</Text>
            <Text style={styles.earningsValue}>Earnings: R35.00</Text>
          </View>
        </View>

        {/* State Indicators */}
        <View style={styles.stateBanner}>
          {isAssigned && (
            <View style={styles.bannerRow}>
              <AlertCircle size={18} color="#B45309" />
              <Text style={styles.bannerText}>State: Assigned • Awaiting driver acceptance</Text>
            </View>
          )}
          {isAccepted && (
            <View style={styles.bannerRow}>
              <Store size={18} color="#1D4ED8" />
              <Text style={styles.bannerText}>State: Accepted • Travel to {activeDelivery.restaurantName}</Text>
            </View>
          )}
          {isPickedUp && (
            <View style={styles.bannerRow}>
              <Package size={18} color="#7C3AED" />
              <Text style={styles.bannerText}>State: Picked Up • Ready to depart</Text>
            </View>
          )}
          {isDelivering && (
            <View style={styles.bannerRow}>
              <Navigation size={18} color="#059669" />
              <Text style={styles.bannerText}>
                State: Delivering • GPS progress: {Math.round((activeDelivery.driverProgress || 0.4) * 100)}%
              </Text>
            </View>
          )}
          {isDelivered && (
            <View style={styles.bannerRow}>
              <CheckCircle size={18} color="#059669" />
              <Text style={styles.bannerText}>State: Delivered • Completed successfully</Text>
            </View>
          )}
        </View>

        {/* Order Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Order Checklist</Text>
          {activeDelivery.items.map((item, idx) => (
            <View key={idx} style={styles.checkItemRow}>
              <CheckCircle size={18} color={THEME.colors.success} />
              <Text style={styles.checkItemText}>
                {item.quantity} × {item.name}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Primary Actions depending on delivery state */}
      <View style={styles.actionFooter}>
        {/* State: Assigned */}
        {isAssigned && (
          <Button
            title="Accept Delivery"
            onPress={() => acceptDelivery(activeDelivery.id)}
            variant="primary"
            size="lg"
            icon={<Check size={18} color="#FFFFFF" />}
          />
        )}

        {/* State: Accepted */}
        {isAccepted && (
          <Button
            title="Confirm Pickup"
            onPress={() => confirmPickup(activeDelivery.id)}
            variant="primary"
            size="lg"
            icon={<Package size={18} color="#FFFFFF" />}
          />
        )}

        {/* State: Picked Up */}
        {isPickedUp && (
          <Button
            title="Start Delivery"
            onPress={() => startDelivery(activeDelivery.id)}
            variant="primary"
            size="lg"
            icon={<Truck size={18} color="#FFFFFF" />}
          />
        )}

        {/* State: Delivering */}
        {isDelivering && (
          <View style={styles.deliveringButtonRow}>
            <Pressable
              style={styles.liveLocationBtn}
              onPress={() => sendLiveLocation(activeDelivery.id)}
              accessibilityRole="button"
              accessibilityLabel="Send Live Location"
            >
              <Send size={16} color={THEME.colors.primary} />
              <Text style={styles.liveLocationBtnText}>Send Live Location</Text>
            </Pressable>

            <Pressable
              style={styles.completeDeliveryBtn}
              onPress={() => setConfirmModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Complete Delivery"
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.completeDeliveryBtnText}>Complete Delivery</Text>
            </Pressable>
          </View>
        )}

        {/* State: Delivered */}
        {isDelivered && (
          <View style={styles.deliveredBox}>
            <CheckCircle size={20} color={THEME.colors.success} />
            <Text style={styles.deliveredBoxText}>
              Delivery Finished! Great job.
            </Text>
          </View>
        )}
      </View>

      {/* Complete Delivery Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <CheckCircle size={40} color={THEME.colors.success} />
            </View>
            <Text style={styles.modalTitle}>Confirm Delivery</Text>
            <Text style={styles.modalSub}>
              Have you handed over the order to {activeDelivery.customerName} at {activeDelivery.deliveryAddress.street}?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => {
                  completeDelivery(activeDelivery.id);
                  setConfirmModalVisible(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Confirm Delivered</Text>
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20,
    minWidth: 180,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 2,
  },
  summarySub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  stateBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 10,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  checkItemText: {
    fontSize: 14,
    color: THEME.colors.text,
  },
  actionFooter: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deliveringButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  liveLocationBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  liveLocationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  completeDeliveryBtn: {
    flex: 1.2,
    height: 52,
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completeDeliveryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deliveredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
  },
  deliveredBoxText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  modalSub: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
