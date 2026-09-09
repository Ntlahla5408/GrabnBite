import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { OrderStatusBadge, Badge } from '../../components/common/Badge';
import { Order, Driver } from '../../types';
import {
  LayoutDashboard,
  Store,
  Bike,
  Truck,
  CheckCircle,
  Plus,
  UserCheck,
  ShieldCheck,
  MapPin,
  X,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const {
    orders,
    restaurants,
    drivers,
    assignDriver,
    approveRestaurant,
    toggleRestaurantApproval,
    approveDriver,
    toggleDriverApproval,
    adminTab,
    setAdminTab,
    switchRole,
    setNotification,
    setOrders,
  } = useApp();

  const [createDeliveryModalVisible, setCreateDeliveryModalVisible] = useState(false);
  const [newOrderRestaurant, setNewOrderRestaurant] = useState('Burger House');
  const [newOrderAddress, setNewOrderAddress] = useState('14 Ocean View Drive, Gqeberha');
  const [newOrderTotal, setNewOrderTotal] = useState('195');

  // Active deliveries are orders that are not yet delivered
  const activeDeliveries = orders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const handleQuickAssign = (orderId: string, driverId: string) => {
    assignDriver(orderId, driverId);
  };

  const handleCreateDeliverySubmit = () => {
    const newOrd: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: 'cust-1',
      customerName: 'Siphamandla Zondi',
      customerPhone: '+27 82 555 9911',
      restaurantId: 'rest-1',
      restaurantName: newOrderRestaurant,
      restaurantAddress: '44 Main Road, Gqeberha',
      items: [{ id: 'item-new', name: 'Deluxe Meal Pack', price: parseFloat(newOrderTotal) || 195, quantity: 1 }],
      subtotal: (parseFloat(newOrderTotal) || 195) - 25,
      deliveryFee: 25,
      total: parseFloat(newOrderTotal) || 195,
      status: 'ready_for_pickup',
      deliveryAddress: {
        id: 'addr-new',
        title: 'Office',
        street: newOrderAddress,
        city: 'Gqeberha',
      },
      paymentMethod: 'Card (•••• 4582)',
      createdAt: 'Just now',
      estimatedDeliveryTime: '25 mins',
      driverProgress: 0,
    };

    setOrders(prev => [newOrd, ...prev]);
    setCreateDeliveryModalVisible(false);
    setNotification(`Delivery ${newOrd.orderNumber} created! Ready for driver assignment.`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Admin Operations"
        subtitle="Platform Management & Fleet Dispatch"
        rightAction={
          <Pressable
            style={styles.switchRoleBtn}
            onPress={() => switchRole('customer')}
          >
            <Text style={styles.switchRoleText}>Exit</Text>
          </Pressable>
        }
      />

      {/* 4 Admin Navigation Tabs */}
      <View style={styles.tabNav}>
        <Pressable
          style={[styles.tabItem, adminTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setAdminTab('dashboard')}
        >
          <LayoutDashboard
            size={16}
            color={adminTab === 'dashboard' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, adminTab === 'dashboard' && styles.tabTextActive]}>
            Dashboard
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, adminTab === 'restaurants' && styles.tabItemActive]}
          onPress={() => setAdminTab('restaurants')}
        >
          <Store
            size={16}
            color={adminTab === 'restaurants' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, adminTab === 'restaurants' && styles.tabTextActive]}>
            Restaurants
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, adminTab === 'drivers' && styles.tabItemActive]}
          onPress={() => setAdminTab('drivers')}
        >
          <Bike
            size={16}
            color={adminTab === 'drivers' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, adminTab === 'drivers' && styles.tabTextActive]}>
            Drivers
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, adminTab === 'deliveries' && styles.tabItemActive]}
          onPress={() => setAdminTab('deliveries')}
        >
          <Truck
            size={16}
            color={adminTab === 'deliveries' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, adminTab === 'deliveries' && styles.tabTextActive]}>
            Deliveries
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW 1: DASHBOARD */}
        {adminTab === 'dashboard' && (
          <View style={styles.viewContent}>
            {/* Metric Cards */}
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricNum}>{orders.length}</Text>
                <Text style={styles.metricLbl}>Total Orders</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricNum}>{restaurants.length}</Text>
                <Text style={styles.metricLbl}>Restaurants</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricNum}>{drivers.length}</Text>
                <Text style={styles.metricLbl}>Drivers</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardHighlight]}>
                <Text style={[styles.metricNum, styles.metricNumHighlight]}>
                  {activeDeliveries.length}
                </Text>
                <Text style={styles.metricLbl}>Active Deliveries</Text>
              </View>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.sectionTitle}>Platform Operations</Text>
              <View style={styles.actionBtnRow}>
                <Pressable
                  style={styles.actionPillBtn}
                  onPress={() => setCreateDeliveryModalVisible(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.actionPillBtnText}>Create Delivery</Text>
                </Pressable>

                <Pressable
                  style={styles.actionPillSecondary}
                  onPress={() => setAdminTab('deliveries')}
                >
                  <Truck size={16} color={THEME.colors.text} />
                  <Text style={styles.actionPillSecondaryText}>View Dispatch</Text>
                </Pressable>
              </View>
            </View>

            {/* Live Dispatch Feed */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Live Deliveries Requiring Action</Text>
              <Badge label={`${activeDeliveries.length} Pending`} variant="warning" />
            </View>

            {activeDeliveries.slice(0, 3).map(order => (
              <View key={order.id} style={styles.miniOrderCard}>
                <View style={styles.miniOrderTop}>
                  <View>
                    <Text style={styles.miniOrderNum}>{order.orderNumber}</Text>
                    <Text style={styles.miniOrderRest}>{order.restaurantName}</Text>
                  </View>
                  <OrderStatusBadge status={order.status} />
                </View>
                <Text style={styles.miniOrderCustomer}>
                  Deliver to {order.deliveryAddress?.street} • Driver: {order.driverName || 'None assigned'}
                </Text>
                {!order.driverName && (
                  <Pressable
                    style={styles.assignFastBtn}
                    onPress={() => setAdminTab('deliveries')}
                  >
                    <Text style={styles.assignFastBtnText}>Assign Driver →</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* VIEW 2: RESTAURANTS (Approve Restaurant) */}
        {adminTab === 'restaurants' && (
          <View style={styles.viewContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Registered Restaurants</Text>
              <Text style={styles.sectionSubCount}>{restaurants.length} Partners</Text>
            </View>

            {restaurants.map(rest => {
              const isApproved = rest.isApproved ?? true;
              return (
                <View key={rest.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    <View style={styles.entityLeft}>
                      <View style={styles.entityIconCircle}>
                        <Store size={20} color={THEME.colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.entityTitle}>{rest.name}</Text>
                        <Text style={styles.entitySub}>{rest.address}</Text>
                      </View>
                    </View>

                    <Badge
                      label={isApproved ? 'Approved' : 'Pending'}
                      variant={isApproved ? 'success' : 'warning'}
                    />
                  </View>

                  <View style={styles.entityMetaRow}>
                    <Text style={styles.entityMetaItem}>Phone: {rest.phone || '+27 41 500 1100'}</Text>
                    <Text style={styles.entityMetaItem}>★ {rest.rating} ({rest.reviewCount})</Text>
                  </View>

                  <View style={styles.entityActions}>
                    <Pressable
                      style={[styles.approvalBtn, isApproved ? styles.revokeBtn : styles.approveBtn]}
                      onPress={() => toggleRestaurantApproval(rest.id)}
                    >
                      <UserCheck size={16} color={isApproved ? '#EF4444' : '#FFFFFF'} />
                      <Text style={[styles.approvalBtnText, isApproved && styles.revokeBtnText]}>
                        {isApproved ? 'Revoke Approval' : 'Approve Restaurant'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* VIEW 3: DRIVERS (Approve Driver) */}
        {adminTab === 'drivers' && (
          <View style={styles.viewContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Fleet Drivers</Text>
              <Text style={styles.sectionSubCount}>{drivers.length} Drivers</Text>
            </View>

            {drivers.map(driver => {
              const isApproved = driver.isApproved ?? true;
              return (
                <View key={driver.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    <View style={styles.entityLeft}>
                      <View style={styles.entityIconCircle}>
                        <Bike size={20} color={THEME.colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.entityTitle}>{driver.name}</Text>
                        <Text style={styles.entitySub}>{driver.vehicle}</Text>
                      </View>
                    </View>

                    <Badge
                      label={isApproved ? 'Approved' : 'Pending'}
                      variant={isApproved ? 'success' : 'warning'}
                    />
                  </View>

                  <View style={styles.entityMetaRow}>
                    <Text style={styles.entityMetaItem}>Reg: {driver.vehicleReg || 'CA 882-901'}</Text>
                    <Text style={styles.entityMetaItem}>★ {driver.rating} • {driver.totalDeliveries} trips</Text>
                    <Text style={styles.entityMetaItem}>
                      {driver.isOnline ? '🟢 Online' : '⚪ Offline'}
                    </Text>
                  </View>

                  <View style={styles.entityActions}>
                    <Pressable
                      style={[styles.approvalBtn, isApproved ? styles.revokeBtn : styles.approveBtn]}
                      onPress={() => toggleDriverApproval(driver.id)}
                    >
                      <ShieldCheck size={16} color={isApproved ? '#EF4444' : '#FFFFFF'} />
                      <Text style={[styles.approvalBtnText, isApproved && styles.revokeBtnText]}>
                        {isApproved ? 'Revoke Approval' : 'Approve Driver'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* VIEW 4: DELIVERIES (Create Delivery, View Available Drivers, Assign Driver) */}
        {adminTab === 'deliveries' && (
          <View style={styles.viewContent}>
            <View style={styles.deliveriesHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Delivery Dispatch</Text>
                <Text style={styles.sectionSub}>Manage orders and assign available drivers</Text>
              </View>
              <Pressable
                style={styles.createDeliveryHeaderBtn}
                onPress={() => setCreateDeliveryModalVisible(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createDeliveryHeaderBtnText}>Create Delivery</Text>
              </Pressable>
            </View>

            {orders.map(order => {
              const isDelivered = order.status === 'delivered';
              const needsDriver = !order.driverName || order.status === 'ready_for_pickup';

              return (
                <View key={order.id} style={styles.dispatchCard}>
                  {/* Order Overview Header */}
                  <View style={styles.dispatchHeader}>
                    <View>
                      <Text style={styles.dispatchOrderNum}>{order.orderNumber}</Text>
                      <Text style={styles.dispatchRestName}>{order.restaurantName}</Text>
                    </View>
                    <OrderStatusBadge status={order.status} />
                  </View>

                  <View style={styles.dispatchInfoBox}>
                    <Text style={styles.dispatchAddress}>
                      Dropoff: {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                    </Text>
                    <Text style={styles.dispatchPrice}>Ticket Total: R{order.total.toFixed(2)}</Text>
                  </View>

                  {/* Current driver status */}
                  {order.driverName ? (
                    <View style={styles.assignedDriverBadge}>
                      <Truck size={16} color="#059669" />
                      <Text style={styles.assignedDriverText}>
                        Assigned to {order.driverName} ({order.driverVehicle})
                      </Text>
                    </View>
                  ) : null}

                  {/* Available Drivers List with instant [ Assign ] action */}
                  {!isDelivered && (
                    <View style={styles.availableDriversSection}>
                      <Text style={styles.availableDriversTitle}>Available Drivers:</Text>
                      <View style={styles.availableDriversList}>
                        {drivers.map(drv => {
                          const isAssignedToThis = order.driverId === drv.id;
                          return (
                            <View key={drv.id} style={styles.driverAssignRow}>
                              <View style={styles.driverInfoLeft}>
                                <Text style={styles.driverAssignName}>{drv.name}</Text>
                                <Text style={styles.driverDistance}>
                                  ({drv.id === 'driver-1' ? '0.8 km' : drv.id === 'driver-2' ? '1.4 km' : '2.1 km'})
                                </Text>
                              </View>

                              <Pressable
                                style={[
                                  styles.assignButton,
                                  isAssignedToThis && styles.assignButtonActive,
                                ]}
                                onPress={() => handleQuickAssign(order.id, drv.id)}
                              >
                                <Text
                                  style={[
                                    styles.assignButtonText,
                                    isAssignedToThis && styles.assignButtonTextActive,
                                  ]}
                                >
                                  {isAssignedToThis ? 'Assigned ✓' : 'Assign'}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Delivery Modal */}
      <Modal
        visible={createDeliveryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateDeliveryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Delivery</Text>
              <Pressable onPress={() => setCreateDeliveryModalVisible(false)}>
                <X size={20} color={THEME.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Restaurant</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newOrderRestaurant}
                  onChangeText={setNewOrderRestaurant}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Delivery Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newOrderAddress}
                  onChangeText={setNewOrderAddress}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Total Value (R)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newOrderTotal}
                  onChangeText={setNewOrderTotal}
                  keyboardType="numeric"
                />
              </View>

              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleCreateDeliverySubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Create & Prepare Dispatch</Text>
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
  switchRoleBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  switchRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  viewContent: {
    gap: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  metricCardHighlight: {
    backgroundColor: '#FFF7ED',
    borderColor: THEME.colors.primary,
  },
  metricNum: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  metricNumHighlight: {
    color: THEME.colors.primary,
  },
  metricLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionPillBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionPillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionPillSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  sectionSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  sectionSubCount: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  miniOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniOrderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  miniOrderNum: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  miniOrderRest: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  miniOrderCustomer: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  assignFastBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  assignFastBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  entityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  entityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  entitySub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  entityMetaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entityMetaItem: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  entityActions: {
    marginTop: 12,
  },
  approvalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtn: {
    backgroundColor: THEME.colors.primary,
  },
  revokeBtn: {
    backgroundColor: '#FEE2E2',
  },
  approvalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revokeBtnText: {
    color: '#DC2626',
  },
  deliveriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createDeliveryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  createDeliveryHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dispatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dispatchOrderNum: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  dispatchRestName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  dispatchInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    gap: 4,
  },
  dispatchAddress: {
    fontSize: 13,
    color: THEME.colors.text,
  },
  dispatchPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  assignedDriverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  assignedDriverText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  availableDriversSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  availableDriversTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  availableDriversList: {
    gap: 8,
  },
  driverAssignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  driverInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverAssignName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  driverDistance: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  assignButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  assignButtonActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  assignButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assignButtonTextActive: {
    color: '#059669',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  modalBody: {
    gap: 12,
  },
  modalField: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: THEME.colors.text,
  },
  modalSubmitBtn: {
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
