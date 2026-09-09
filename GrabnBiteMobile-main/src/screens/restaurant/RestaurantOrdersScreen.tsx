import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Icon } from '../../components/common/Icon';
import { Check, Clock, Package, CheckCircle, Truck, Navigation } from 'lucide-react';

type RestaurantOrderFilter = 'new' | 'preparing' | 'ready' | 'completed';

export const RestaurantOrdersScreen: React.FC = () => {
  const {
    currentUser,
    restaurants,
    orders,
    acceptOrder,
    startPreparing,
    readyForPickup,
  } = useApp();

  const myRestaurant =
    restaurants.find(r => r.id === currentUser.restaurantId) || restaurants[0];

  const [filter, setFilter] = useState<RestaurantOrderFilter>('new');

  // Filter orders for this restaurant
  const restaurantOrders = orders.filter(
    o => o.restaurantId === myRestaurant.id || !o.restaurantId
  );

  const newOrders = restaurantOrders.filter(o => o.status === 'placed');
  const preparingOrders = restaurantOrders.filter(
    o => o.status === 'accepted' || o.status === 'preparing'
  );
  const readyOrders = restaurantOrders.filter(
    o => o.status === 'ready_for_pickup' || o.status === 'picking_up'
  );
  const completedOrders = restaurantOrders.filter(
    o => o.status === 'on_the_way' || o.status === 'delivered'
  );

  let displayedOrders = newOrders;
  if (filter === 'preparing') displayedOrders = preparingOrders;
  else if (filter === 'ready') displayedOrders = readyOrders;
  else if (filter === 'completed') displayedOrders = completedOrders;

  return (
    <View style={styles.container}>
      <Header
        title="Kitchen Orders"
        subtitle={`${myRestaurant.name} • Operations`}
      />

      {/* 4 Status Filter Tabs as requested */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <Pressable
          style={[styles.filterTab, filter === 'new' && styles.filterTabActive]}
          onPress={() => setFilter('new')}
        >
          <Text style={[styles.filterTabText, filter === 'new' && styles.filterTabTextActive]}>
            New Orders ({newOrders.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'preparing' && styles.filterTabActive]}
          onPress={() => setFilter('preparing')}
        >
          <Text style={[styles.filterTabText, filter === 'preparing' && styles.filterTabTextActive]}>
            Preparing ({preparingOrders.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'ready' && styles.filterTabActive]}
          onPress={() => setFilter('ready')}
        >
          <Text style={[styles.filterTabText, filter === 'ready' && styles.filterTabTextActive]}>
            Ready for Pickup ({readyOrders.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]}>
            Completed ({completedOrders.length})
          </Text>
        </Pressable>
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={44} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders in this status</Text>
            <Text style={styles.emptySubtitle}>
              Orders will appear here as their status updates through the kitchen workflow.
            </Text>
          </View>
        ) : (
          displayedOrders.map(order => {
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Header: Order Number, Customer, Time */}
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
                    <Text style={styles.orderSummaryMeta}>
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} • R{order.total.toFixed(2)}
                    </Text>
                  </View>
                  <OrderStatusBadge status={order.status} />
                </View>

                {/* Items List */}
                <View style={styles.itemsBox}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.quantity} ×</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>
                        R{(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Order Special Notes */}
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>
                    <Text style={styles.notesLabel}>Notes: </Text>
                    {order.notes || (order.id === 'order-1042' ? 'No onions on classic burger' : 'Standard preparation')}
                  </Text>
                </View>

                {/* Guided Workflow Primary Action Button */}
                <View style={styles.actionContainer}>
                  {order.status === 'placed' && (
                    <Button
                      title="Accept Order"
                      onPress={() => acceptOrder(order.id)}
                      variant="primary"
                      size="lg"
                      icon={<Check size={18} color="#FFFFFF" />}
                    />
                  )}

                  {order.status === 'accepted' && (
                    <Button
                      title="Start Preparing"
                      onPress={() => startPreparing(order.id)}
                      variant="secondary"
                      size="lg"
                      icon={<Clock size={18} color="#FFFFFF" />}
                    />
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      title="Mark Ready for Pickup"
                      onPress={() => readyForPickup(order.id)}
                      variant="primary"
                      size="lg"
                      icon={<Package size={18} color="#FFFFFF" />}
                    />
                  )}

                  {order.status === 'ready_for_pickup' && (
                    <View style={styles.statusWaitBanner}>
                      <Clock size={18} color={THEME.colors.warning} />
                      <Text style={styles.statusWaitText}>
                        Ready for Pickup • Waiting for Driver Assignment
                      </Text>
                    </View>
                  )}

                  {order.status === 'picking_up' && (
                    <View style={styles.driverDispatchedBanner}>
                      <Truck size={18} color={THEME.colors.primary} />
                      <Text style={styles.driverDispatchedText}>
                        Driver {order.driverName} is arriving at restaurant to collect
                      </Text>
                    </View>
                  )}

                  {order.status === 'on_the_way' && (
                    <View style={styles.onTheWayBanner}>
                      <Navigation size={18} color={THEME.colors.info} />
                      <Text style={styles.onTheWayText}>
                        Picked up by {order.driverName} • Out for delivery
                      </Text>
                    </View>
                  )}

                  {order.status === 'delivered' && (
                    <View style={styles.deliveredBanner}>
                      <CheckCircle size={18} color={THEME.colors.success} />
                      <Text style={styles.deliveredText}>
                        Order completed and delivered to customer
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterBar: {
    maxHeight: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  orderSummaryMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  itemsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 15,
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
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  notesLabel: {
    fontWeight: '700',
    color: '#92400E',
  },
  notesText: {
    fontSize: 13,
    color: '#92400E',
  },
  actionContainer: {
    marginTop: 14,
  },
  statusWaitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
  },
  statusWaitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  driverDispatchedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 10,
  },
  driverDispatchedText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.primary,
    flex: 1,
  },
  onTheWayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
  },
  onTheWayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    flex: 1,
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
  },
  deliveredText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },
});
