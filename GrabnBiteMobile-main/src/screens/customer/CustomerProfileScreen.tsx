import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';

export const CustomerProfileScreen: React.FC = () => {
  const {
    currentUser,
    addresses,
    addAddress,
    setCustomerTab,
    switchRole,
    setNotification,
  } = useApp();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');

  const handleSaveAddress = () => {
    if (!newTitle.trim() || !newStreet.trim()) {
      setNotification('Please enter address title and street');
      return;
    }
    addAddress({
      title: newTitle.trim(),
      street: newStreet.trim(),
      city: newCity.trim() || 'Cape Town',
      isDefault: false,
    });
    setNewTitle('');
    setNewStreet('');
    setNewCity('');
    setAddressModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          {currentUser.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Icon name="user" size={32} color={THEME.colors.primary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
            <Text style={styles.userPhone}>{currentUser.phone}</Text>
          </View>
        </View>

        {/* Section: Delivery Addresses */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Icon name="map-pin" size={18} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Addresses</Text>
            </View>
            <Pressable
              onPress={() => setAddressModalVisible(true)}
              hitSlop={8}
            >
              <Text style={styles.addAddressAction}>+ Add New</Text>
            </Pressable>
          </View>

          {addresses.map(addr => (
            <View key={addr.id} style={styles.addressRow}>
              <View style={styles.addressLeft}>
                <View style={styles.addressTitleRow}>
                  <Text style={styles.addrTitle}>{addr.title}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addrStreet}>{addr.street}</Text>
                <Text style={styles.addrCity}>{addr.city}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={THEME.colors.textMuted} />
            </View>
          ))}
        </View>

        {/* Section: Quick Actions */}
        <View style={styles.menuCard}>
          <Pressable
            style={styles.menuRow}
            onPress={() => setCustomerTab('orders')}
          >
            <View style={styles.menuLeft}>
              <Icon name="package" size={20} color={THEME.colors.textPrimary} />
              <Text style={styles.menuLabel}>Order History</Text>
            </View>
            <Icon name="chevron-right" size={18} color={THEME.colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.menuRow}
            onPress={() => setNotification('Settings configured for Cape Town region')}
          >
            <View style={styles.menuLeft}>
              <Icon name="sliders" size={20} color={THEME.colors.textPrimary} />
              <Text style={styles.menuLabel}>App Settings & Notifications</Text>
            </View>
            <Icon name="chevron-right" size={18} color={THEME.colors.textMuted} />
          </Pressable>
        </View>

        {/* Role Preview Switcher helper inside app */}
        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>Demo: Test Other App Roles</Text>
          <Text style={styles.roleSubtitle}>
            GrabnBite has 4 connected roles in this single application:
          </Text>
          <View style={styles.roleButtonsRow}>
            <Pressable
              style={styles.roleBtn}
              onPress={() => switchRole('restaurant')}
            >
              <Icon name="store" size={16} color={THEME.colors.primary} />
              <Text style={styles.roleBtnText}>Restaurant</Text>
            </Pressable>
            <Pressable
              style={styles.roleBtn}
              onPress={() => switchRole('driver')}
            >
              <Icon name="truck" size={16} color={THEME.colors.primary} />
              <Text style={styles.roleBtnText}>Driver</Text>
            </Pressable>
            <Pressable
              style={styles.roleBtn}
              onPress={() => switchRole('admin')}
            >
              <Icon name="shield" size={16} color={THEME.colors.primary} />
              <Text style={styles.roleBtnText}>Admin</Text>
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <Button
          title="Log Out"
          onPress={() => setNotification('Logged out successfully')}
          variant="outline"
          size="md"
          icon={<Icon name="log-out" size={16} color={THEME.colors.primary} />}
          style={styles.logoutButton}
        />
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add Delivery Address</Text>
              <Pressable onPress={() => setAddressModalVisible(false)} hitSlop={8}>
                <Icon name="x" size={20} color={THEME.colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label (e.g. Home, Work, Gym)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Home"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 50 Kloof Street, Gardens"
                value={newStreet}
                onChangeText={setNewStreet}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / Area</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Cape Town, 8001"
                value={newCity}
                onChangeText={setNewCity}
              />
            </View>

            <Button
              title="Save Address"
              onPress={handleSaveAddress}
              size="lg"
              style={styles.saveAddrBtn}
            />
          </View>
        </View>
      </Modal>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  addAddressAction: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  addressLeft: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  addrStreet: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  addrCity: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  menuCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
  },
  roleCard: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginVertical: 4,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 4,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logoutButton: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radii.lg,
    borderTopRightRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    outlineStyle: 'none' as any,
  },
  saveAddrBtn: {
    marginTop: THEME.spacing.sm,
  },
});
