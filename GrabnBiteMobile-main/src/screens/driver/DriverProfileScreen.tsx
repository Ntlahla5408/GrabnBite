import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';

export const DriverProfileScreen: React.FC = () => {
  const { currentDriver, switchRole, setNotification } = useApp();

  return (
    <View style={styles.container}>
      <Header title="Driver Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: currentDriver.avatar }} style={styles.avatar} />
          <View style={styles.details}>
            <Text style={styles.name}>{currentDriver.name}</Text>
            <Text style={styles.sub}>{currentDriver.phone}</Text>
            <View style={styles.vehicleBadge}>
              <Icon name="truck" size={14} color={THEME.colors.primary} />
              <Text style={styles.vehicleText}>{currentDriver.vehicle}</Text>
            </View>
          </View>
        </View>

        {/* Performance metrics */}
        <View style={styles.metricsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{currentDriver.rating} ★</Text>
            <Text style={styles.metricLbl}>Customer Rating</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{currentDriver.totalDeliveries}</Text>
            <Text style={styles.metricLbl}>Lifetime Runs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>99.4%</Text>
            <Text style={styles.metricLbl}>Acceptance</Text>
          </View>
        </View>

        {/* Demo role switch */}
        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>Demo: Role Switcher</Text>
          <Text style={styles.roleSubtitle}>
            Jump back to Customer or switch to Restaurant / Admin:
          </Text>
          <View style={styles.roleButtonsRow}>
            <Pressable
              style={styles.roleBtn}
              onPress={() => switchRole('customer')}
            >
              <Icon name="shopping-bag" size={16} color={THEME.colors.primary} />
              <Text style={styles.roleBtnText}>Customer</Text>
            </Pressable>
            <Pressable
              style={styles.roleBtn}
              onPress={() => switchRole('restaurant')}
            >
              <Icon name="store" size={16} color={THEME.colors.primary} />
              <Text style={styles.roleBtnText}>Restaurant</Text>
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

        <Button
          title="Sign Out"
          onPress={() => setNotification('Driver signed out')}
          variant="outline"
          size="md"
          icon={<Icon name="log-out" size={16} color={THEME.colors.primary} />}
        />
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    marginTop: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'space-around',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  metricLbl: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
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
});
