import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';

export const RestaurantDashboardScreen: React.FC = () => {
  const {
    currentUser,
    restaurants,
    toggleRestaurantOpen,
    orders,
    setRestaurantTab,
  } = useApp();

  const myRestaurant =
    restaurants.find(r => r.id === currentUser.restaurantId) || restaurants[0];

  const pendingOrders = orders.filter(
    o => o.restaurantId === myRestaurant.id && o.status === 'placed'
  );
  const preparingOrders = orders.filter(
    o =>
      o.restaurantId === myRestaurant.id &&
      (o.status === 'accepted' || o.status === 'preparing')
  );
  const readyOrders = orders.filter(
    o => o.restaurantId === myRestaurant.id && o.status === 'ready_for_pickup'
  );

  return (
    <View style={styles.container}>
      <Header
        title={myRestaurant.name}
        subtitle="Restaurant Manager Dashboard"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Open / Closed Store Toggle Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <View style={styles.statusHeaderRow}>
              <View
                style={[
                  styles.statusIndicatorDot,
                  {
                    backgroundColor: myRestaurant.isOpen
                      ? THEME.colors.success
                      : THEME.colors.danger,
                  },
                ]}
              />
              <Text style={styles.statusTitle}>
                Store is currently {myRestaurant.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
            <Text style={styles.statusSub}>
              {myRestaurant.isOpen
                ? 'Accepting incoming customer orders and kitchen dispatches.'
                : 'Pause orders during peak rush or closing hours.'}
            </Text>
          </View>

          <Switch
            value={myRestaurant.isOpen}
            onValueChange={() => toggleRestaurantOpen(myRestaurant.id)}
            trackColor={{ false: THEME.colors.border, true: THEME.colors.success }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Action Highlights / Order Stats */}
        <Text style={styles.sectionTitle}>Today's Live Orders</Text>

        <View style={styles.statsRow}>
          {/* New Orders */}
          <Pressable
            style={[styles.statBox, pendingOrders.length > 0 && styles.statBoxAlert]}
            onPress={() => setRestaurantTab('orders')}
          >
            <Text style={styles.statNumber}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
            <Badge
              label={pendingOrders.length > 0 ? 'Needs Action' : 'All Clear'}
              variant={pendingOrders.length > 0 ? 'primary' : 'neutral'}
              size="sm"
            />
          </Pressable>

          {/* Orders Being Prepared */}
          <Pressable
            style={styles.statBox}
            onPress={() => setRestaurantTab('orders')}
          >
            <Text style={styles.statNumber}>{preparingOrders.length}</Text>
            <Text style={styles.statLabel}>In Kitchen</Text>
            <Badge label="Preparing" variant="warning" size="sm" />
          </Pressable>
        </View>

        <View style={styles.readyCard}>
          <View style={styles.readyLeft}>
            <Icon name="package" size={20} color={THEME.colors.info} />
            <View style={styles.readyTextContainer}>
              <Text style={styles.readyTitle}>Ready for Driver Pickup</Text>
              <Text style={styles.readySub}>
                {readyOrders.length} order(s) waiting on driver arrival
              </Text>
            </View>
          </View>
          <Text style={styles.readyCount}>{readyOrders.length}</Text>
        </View>

        {/* Primary Action Button to Jump to Orders Workflow */}
        <View style={styles.primaryActionCard}>
          <View style={styles.actionCardLeft}>
            <Text style={styles.actionCardTitle}>Kitchen Display & Orders</Text>
            <Text style={styles.actionCardSub}>
              Review tickets, accept pending orders, and mark them ready.
            </Text>
          </View>
          <Button
            title="Open Orders Workflow"
            onPress={() => setRestaurantTab('orders')}
            size="md"
            icon={<Icon name="arrow-right" size={16} color="#FFFFFF" />}
            style={styles.actionCardBtn}
          />
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.radii.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  statusSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: THEME.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  statBoxAlert: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  readyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  readyTextContainer: {
    flex: 1,
  },
  readyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  readySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  readyCount: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.info,
    paddingHorizontal: 8,
  },
  primaryActionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  actionCardLeft: {
    marginBottom: THEME.spacing.md,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionCardSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  actionCardBtn: {
    width: '100%',
  },
});
