import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { MapPin, CreditCard, Clock, Store, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../../types';

export const OrderDetailsScreen: React.FC = () => {
  const {
    selectedOrderDetailsId,
    orders,
    setCustomerScreen,
    setTrackingOrderId,
  } = useApp();

  const order = orders.find(o => o.id === selectedOrderDetailsId) || orders[0];

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Details" showBack onBack={() => setCustomerScreen('tabs')} />
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return { label: 'Order Placed', color: '#D97706', bg: '#FEF3C7' };
      case 'accepted':
        return { label: 'Accepted', color: '#2563EB', bg: '#DBEAFE' };
      case 'preparing':
        return { label: 'Preparing', color: '#7C3AED', bg: '#EDE9FE' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: '#059669', bg: '#D1FAE5' };
      case 'picking_up':
      case 'on_the_way':
        return { label: 'On the Way', color: THEME.colors.primary, bg: '#FFF7ED' };
      case 'delivered':
        return { label: 'Delivered', color: '#059669', bg: '#ECFDF5' };
      default:
        return { label: status, color: THEME.colors.textSecondary, bg: '#F3F4F6' };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header
        title={`Order ${order.orderNumber}`}
        showBack
        onBack={() => setCustomerScreen('tabs')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
              <Text style={styles.orderDateText}>{order.createdAt}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Store size={18} color={THEME.colors.primary} />
            <Text style={styles.cardTitle}>Restaurant</Text>
          </View>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          <Text style={styles.restaurantAddress}>{order.restaurantAddress}</Text>
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>
          <View style={styles.itemsList}>
            {order.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity} ×</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>R{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Pricing breakdown */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceVal}>R{order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceVal}>R{order.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>R{order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address & Payment */}
        <View style={styles.card}>
          <View style={styles.infoBlock}>
            <View style={styles.infoIconCol}>
              <MapPin size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.infoDetails}>
              <Text style={styles.infoTitle}>Delivery Address</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress?.street}</Text>
              <Text style={styles.infoSub}>{order.deliveryAddress?.city}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <View style={styles.infoIconCol}>
              <CreditCard size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.infoDetails}>
              <Text style={styles.infoTitle}>Payment Status</Text>
              <Text style={styles.infoValue}>Paid via {order.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Action Button for Active Orders */}
        {isActive && (
          <Pressable
            style={({ pressed }) => [styles.trackButton, pressed && styles.buttonPressed]}
            onPress={() => {
              setTrackingOrderId(order.id);
              setCustomerScreen('order-tracking');
            }}
            accessibilityRole="button"
            accessibilityLabel="Track Order"
          >
            <Text style={styles.trackButtonText}>Track Order</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  orderDateText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 2,
  },
  restaurantAddress: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  itemsList: {
    marginTop: 10,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
    width: 32,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.text,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  infoBlock: {
    flexDirection: 'row',
    gap: 12,
  },
  infoIconCol: {
    marginTop: 2,
  },
  infoDetails: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 2,
  },
  infoSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  trackButton: {
    backgroundColor: THEME.colors.primary,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notFoundBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
});
