import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { MapPin, CreditCard, Plus, Check, ArrowRight, X } from 'lucide-react';
import { Address } from '../../types';

export const CheckoutScreen: React.FC = () => {
  const {
    cart,
    cartRestaurant,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    addresses,
    selectedAddress,
    setSelectedAddress,
    addAddress,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    createPendingOrder,
    setCustomerScreen,
    setCustomerTab,
  } = useApp();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // New address form state
  const [newTitle, setNewTitle] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Gqeberha');

  const paymentOptions = [
    { id: 'card', name: 'Card (•••• 4582)', icon: CreditCard, hint: 'Visa / Mastercard' },
    { id: 'eft', name: 'Instant EFT', icon: CreditCard, hint: 'Capitec / FNB / Nedbank' },
    { id: 'cash', name: 'Cash on Delivery', icon: CreditCard, hint: 'Pay the driver directly' },
  ];

  const handleContinueToPayment = () => {
    try {
      createPendingOrder();
      setCustomerScreen('payment');
    } catch {
      setCustomerScreen('tabs');
      setCustomerTab('cart');
    }
  };

  const handleSaveNewAddress = () => {
    if (!newTitle.trim() || !newStreet.trim()) return;
    addAddress({
      title: newTitle.trim(),
      street: newStreet.trim(),
      city: newCity.trim(),
    });
    setNewTitle('');
    setNewStreet('');
    setShowAddAddressForm(false);
    setAddressModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header
        title="Checkout"
        showBack
        onBack={() => {
          setCustomerScreen('tabs');
          setCustomerTab('cart');
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MapPin size={18} color={THEME.colors.primary} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <Pressable
              style={styles.changeBtn}
              onPress={() => setAddressModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>{selectedAddress.title}</Text>
            <Text style={styles.addressStreet}>{selectedAddress.street}</Text>
            <Text style={styles.addressCity}>{selectedAddress.city}</Text>
          </View>
        </View>

        {/* Section 2: Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <CreditCard size={18} color={THEME.colors.primary} />
              <Text style={styles.cardTitle}>Payment Method</Text>
            </View>
            <Pressable
              style={styles.changeBtn}
              onPress={() => setPaymentModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Change payment method"
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.paymentBox}>
            <CreditCard size={20} color={THEME.colors.primary} />
            <Text style={styles.paymentMethodText}>{selectedPaymentMethod}</Text>
          </View>
        </View>

        {/* Section 3: Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <Text style={styles.restaurantTag}>{cartRestaurant?.name || 'Burger House'}</Text>
          </View>

          <View style={styles.itemsList}>
            {cart.map(item => (
              <View key={item.menuItem.id} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName}>
                  {item.menuItem.name} × {item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  R{(item.menuItem.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceVal}>R{cartSubtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery</Text>
            <Text style={styles.priceVal}>R{cartDeliveryFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>R{cartTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleContinueToPayment}
            accessibilityRole="button"
            accessibilityLabel="Continue to Payment"
          >
            <Text style={styles.primaryButtonText}>Continue to Payment</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              <Pressable onPress={() => setAddressModalVisible(false)}>
                <X size={20} color={THEME.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {addresses.map(addr => {
                const isSelected = addr.id === selectedAddress.id;
                return (
                  <Pressable
                    key={addr.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedAddress(addr);
                      setAddressModalVisible(false);
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <MapPin
                        size={18}
                        color={isSelected ? THEME.colors.primary : THEME.colors.textSecondary}
                      />
                      <View>
                        <Text style={styles.modalItemTitle}>{addr.title}</Text>
                        <Text style={styles.modalItemSub}>{addr.street}, {addr.city}</Text>
                      </View>
                    </View>
                    {isSelected && <Check size={18} color={THEME.colors.primary} />}
                  </Pressable>
                );
              })}

              {!showAddAddressForm ? (
                <Pressable
                  style={styles.addNewAddressBtn}
                  onPress={() => setShowAddAddressForm(true)}
                >
                  <Plus size={18} color={THEME.colors.primary} />
                  <Text style={styles.addNewAddressBtnText}>Add New Address</Text>
                </Pressable>
              ) : (
                <View style={styles.newAddressForm}>
                  <Text style={styles.formTitle}>Add New Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Address Label (e.g. Work, Beachfront)"
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Street Address (e.g. 12 Example Street)"
                    value={newStreet}
                    onChangeText={setNewStreet}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="City (e.g. Gqeberha)"
                    value={newCity}
                    onChangeText={setNewCity}
                  />
                  <Pressable
                    style={styles.saveAddressBtn}
                    onPress={handleSaveNewAddress}
                  >
                    <Text style={styles.saveAddressBtnText}>Save Address</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <Pressable onPress={() => setPaymentModalVisible(false)}>
                <X size={20} color={THEME.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {paymentOptions.map(opt => {
                const isSelected = selectedPaymentMethod.includes(opt.id) || selectedPaymentMethod === opt.name;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedPaymentMethod(opt.name);
                      setPaymentModalVisible(false);
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <CreditCard
                        size={20}
                        color={isSelected ? THEME.colors.primary : THEME.colors.textSecondary}
                      />
                      <View>
                        <Text style={styles.modalItemTitle}>{opt.name}</Text>
                        <Text style={styles.modalItemSub}>{opt.hint}</Text>
                      </View>
                    </View>
                    {isSelected && <Check size={18} color={THEME.colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  addressBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  addressStreet: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 13,
    color: THEME.colors.textTertiary,
    marginTop: 2,
  },
  paymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  restaurantTag: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  itemsList: {
    gap: 8,
    marginTop: 4,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 15,
    color: THEME.colors.text,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
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
  actionContainer: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalBody: {
    gap: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  modalItemSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#FFF7ED',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalItemSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addNewAddressBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  newAddressForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    gap: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: THEME.colors.text,
  },
  saveAddressBtn: {
    backgroundColor: THEME.colors.primary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveAddressBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
