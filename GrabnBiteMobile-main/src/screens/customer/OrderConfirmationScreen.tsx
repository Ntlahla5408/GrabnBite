import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { CheckCircle, Clock, MapPin, ArrowRight } from 'lucide-react';

export const OrderConfirmationScreen: React.FC = () => {
  const {
    lastPlacedOrder,
    orders,
    setCustomerScreen,
    setTrackingOrderId,
    setSelectedOrderDetailsId,
  } = useApp();

  const currentOrder = lastPlacedOrder || orders[0];
  const orderNumber = currentOrder ? currentOrder.orderNumber : '#1042';
  const restaurantName = currentOrder ? currentOrder.restaurantName : 'Burger House';
  const total = currentOrder ? currentOrder.total : 205;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIconBadge}>
            <CheckCircle size={60} color={THEME.colors.success} />
          </View>

          <Text style={styles.headline}>Order placed!</Text>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          <Text style={styles.totalText}>R{total.toFixed(2)}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={18} color={THEME.colors.primary} />
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Estimated delivery</Text>
                <Text style={styles.infoValue}>25–35 minutes</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MapPin size={18} color={THEME.colors.primary} />
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Delivery address</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {currentOrder?.deliveryAddress?.street || '12 Example Street, Gqeberha'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (currentOrder) {
                setTrackingOrderId(currentOrder.id);
              }
              setCustomerScreen('order-tracking');
            }}
            accessibilityRole="button"
            accessibilityLabel="Track Order"
          >
            <Text style={styles.primaryButtonText}>Track Order</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => {
              if (currentOrder) {
                setSelectedOrderDetailsId(currentOrder.id);
                setCustomerScreen('order-details');
              } else {
                setCustomerScreen('tabs');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="View Order"
          >
            <Text style={styles.secondaryButtonText}>View Order</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 6,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  totalText: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.text,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
});
