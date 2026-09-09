import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { CreditCard, Landmark, Banknote, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export const PaymentScreen: React.FC = () => {
  const {
    lastPlacedOrder,
    cartTotal,
    cartSubtotal,
    cartDeliveryFee,
    cartRestaurant,
    selectedPaymentMethod,
    processPayment,
    paymentProcessing,
    paymentResult,
    setCustomerScreen,
    setTrackingOrderId,
    setSelectedOrderDetailsId,
  } = useApp();

  const [simulateFailToggle, setSimulateFailToggle] = useState(false);

  // Total amount strictly derived from order / cart, never typed by user
  const totalAmount = lastPlacedOrder ? lastPlacedOrder.total : cartTotal;
  const orderNumber = lastPlacedOrder ? lastPlacedOrder.orderNumber : '#1042';
  const restaurantName = lastPlacedOrder ? lastPlacedOrder.restaurantName : cartRestaurant?.name || 'Burger House';

  const handlePay = async () => {
    await processPayment(simulateFailToggle);
  };

  // If payment succeeded
  if (paymentResult === 'success') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={64} color={THEME.colors.success} />
          </View>

          <Text style={styles.successTitle}>Payment successful</Text>
          <Text style={styles.successSubtitle}>Your order has been placed.</Text>

          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>Order {orderNumber}</Text>
            <Text style={styles.orderAmountText}>R{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.successActionBox}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => {
                if (lastPlacedOrder) {
                  setTrackingOrderId(lastPlacedOrder.id);
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
                setCustomerScreen('order-confirmation');
              }}
              accessibilityRole="button"
              accessibilityLabel="View Confirmation"
            >
              <Text style={styles.secondaryButtonText}>View Confirmation</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If payment failed
  if (paymentResult === 'failed') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.failureContainer}>
          <View style={styles.failIconCircle}>
            <AlertTriangle size={64} color={THEME.colors.danger} />
          </View>

          <Text style={styles.failTitle}>Payment failed</Text>
          <Text style={styles.failSubtitle}>
            Your order has not been paid. Your card was not charged.
          </Text>

          <View style={styles.failCard}>
            <Text style={styles.failCardLabel}>Amount Due</Text>
            <Text style={styles.failCardAmount}>R{totalAmount.toFixed(2)}</Text>
            <Text style={styles.failCardHint}>Reason: Simulated bank decline or network timeout</Text>
          </View>

          <View style={styles.failActionBox}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => {
                setSimulateFailToggle(false);
                handlePay();
              }}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <RefreshCw size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={() => setCustomerScreen('checkout')}
              accessibilityRole="button"
              accessibilityLabel="Change Payment Method"
            >
              <Text style={styles.secondaryButtonText}>Change Payment Method</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Standard payment screen
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header
        title="Payment"
        showBack
        onBack={() => setCustomerScreen('checkout')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total to Pay</Text>
          <Text style={styles.amountValue}>R{totalAmount.toFixed(2)}</Text>
          <Text style={styles.amountRestaurant}>{restaurantName}</Text>
        </View>

        {/* Payment Method Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {selectedPaymentMethod.toLowerCase().includes('card') ? (
            <View style={styles.methodBox}>
              <View style={styles.methodIconBadge}>
                <CreditCard size={24} color={THEME.colors.primary} />
              </View>
              <View style={styles.methodDetails}>
                <Text style={styles.methodTitle}>Credit / Debit Card</Text>
                <Text style={styles.methodSub}>Card ending in 4582</Text>
                <Text style={styles.securedNotice}>🔒 Secured 256-bit payment gateway</Text>
              </View>
            </View>
          ) : selectedPaymentMethod.toLowerCase().includes('eft') ? (
            <View style={styles.methodBox}>
              <View style={styles.methodIconBadge}>
                <Landmark size={24} color={THEME.colors.primary} />
              </View>
              <View style={styles.methodDetails}>
                <Text style={styles.methodTitle}>Instant EFT</Text>
                <Text style={styles.methodSub}>Capitec / FNB / Nedbank / Standard Bank</Text>
                <Text style={styles.securedNotice}>Payment will be verified instantly</Text>
              </View>
            </View>
          ) : (
            <View style={styles.methodBox}>
              <View style={styles.methodIconBadge}>
                <Banknote size={24} color={THEME.colors.primary} />
              </View>
              <View style={styles.methodDetails}>
                <Text style={styles.methodTitle}>Cash on Delivery</Text>
                <Text style={styles.methodSub}>Pay the driver when your order arrives.</Text>
                <Text style={styles.securedNotice}>Please prepare exact cash if possible</Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Summary Recap */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items Subtotal</Text>
            <Text style={styles.summaryVal}>
              R{(lastPlacedOrder ? lastPlacedOrder.subtotal : cartSubtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>
              R{(lastPlacedOrder ? lastPlacedOrder.deliveryFee : cartDeliveryFee).toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalVal}>R{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Testing simulation option: simulate failure */}
        <View style={styles.demoOptionBox}>
          <Text style={styles.demoOptionTitle}>PROTOTYPE TEST OPTION</Text>
          <Pressable
            style={[styles.toggleBtn, simulateFailToggle && styles.toggleBtnActive]}
            onPress={() => setSimulateFailToggle(!simulateFailToggle)}
          >
            <Text style={[styles.toggleBtnText, simulateFailToggle && styles.toggleBtnTextActive]}>
              {simulateFailToggle ? 'Simulate Payment Failure: ON' : 'Simulate Payment Failure: OFF'}
            </Text>
          </Pressable>
        </View>

        {/* Primary Action: Pay Button */}
        <View style={styles.paySection}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              paymentProcessing && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePay}
            disabled={paymentProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Pay R${totalAmount.toFixed(2)}`}
          >
            {paymentProcessing ? (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Processing payment...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Pay R{totalAmount.toFixed(2)}</Text>
            )}
          </Pressable>
        </View>
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
    padding: 20,
    gap: 16,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 38,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginTop: 6,
  },
  amountRestaurant: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 14,
  },
  methodBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  methodSub: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  securedNotice: {
    fontSize: 12,
    color: THEME.colors.success,
    fontWeight: '500',
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  summaryTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  demoOptionBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  demoOptionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: THEME.colors.danger,
  },
  paySection: {
    marginTop: 10,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },
  secondaryButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  orderBadge: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 24,
    alignItems: 'center',
  },
  orderBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  orderAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginTop: 4,
  },
  successActionBox: {
    width: '100%',
    gap: 10,
  },
  // Failure screen styles
  failureContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  failTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  failSubtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  failCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  failCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  failCardAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.danger,
    marginTop: 4,
  },
  failCardHint: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    marginTop: 6,
  },
  failActionBox: {
    width: '100%',
    gap: 10,
  },
});
