import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { THEME } from './theme';
import { Icon } from './components/common/Icon';
import { BottomTabBar, TabItem } from './components/navigation/BottomTabBar';

// Auth Screens
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';

// Customer Screens
import { CustomerHomeScreen } from './screens/customer/CustomerHomeScreen';
import { RestaurantDetailsScreen } from './screens/customer/RestaurantDetailsScreen';
import { CartScreen } from './screens/customer/CartScreen';
import { CheckoutScreen } from './screens/customer/CheckoutScreen';
import { PaymentScreen } from './screens/customer/PaymentScreen';
import { OrderConfirmationScreen } from './screens/customer/OrderConfirmationScreen';
import { OrderTrackingScreen } from './screens/customer/OrderTrackingScreen';
import { OrderDetailsScreen } from './screens/customer/OrderDetailsScreen';
import { CustomerOrdersScreen } from './screens/customer/CustomerOrdersScreen';
import { CustomerProfileScreen } from './screens/customer/CustomerProfileScreen';

// Restaurant Screens
import { RestaurantDashboardScreen } from './screens/restaurant/RestaurantDashboardScreen';
import { RestaurantOrdersScreen } from './screens/restaurant/RestaurantOrdersScreen';
import { RestaurantMenuScreen } from './screens/restaurant/RestaurantMenuScreen';

// Driver Screens
import { DriverHomeScreen } from './screens/driver/DriverHomeScreen';
import { DriverDeliveryScreen } from './screens/driver/DriverDeliveryScreen';
import { DriverProfileScreen } from './screens/driver/DriverProfileScreen';

// Admin Screens
import { AdminDashboardScreen } from './screens/admin/AdminDashboardScreen';

const customerTabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'package' },
  { id: 'cart', label: 'Cart', icon: 'shopping-cart' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const restaurantTabs: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'store' },
  { id: 'orders', label: 'Kitchen', icon: 'package' },
  { id: 'menu', label: 'Menu', icon: 'edit' },
];

const driverTabs: TabItem[] = [
  { id: 'home', label: 'Deliveries', icon: 'truck' },
  { id: 'delivery', label: 'Active Route', icon: 'navigation' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const MainNavigator: React.FC = () => {
  const {
    isAuthenticated,
    authScreen,
    currentRole,
    switchRole,
    customerScreen,
    customerTab,
    setCustomerTab,
    setCustomerScreen,
    restaurantTab,
    setRestaurantTab,
    driverTab,
    setDriverTab,
    orders,
    cartItemCount,
    notification,
    clearNotification,
  } = useApp();

  // If user is not authenticated, render the auth journey (Welcome, Login, Register)
  if (!isAuthenticated) {
    if (authScreen === 'login') return <LoginScreen />;
    if (authScreen === 'register') return <RegisterScreen />;
    return <WelcomeScreen />;
  }

  // Active order count for badges
  const activeOrdersCount = orders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  // Enhance customer tabs with dynamic badge
  const dynamicCustomerTabs = customerTabs.map(t => {
    if (t.id === 'orders' && activeOrdersCount > 0) {
      return { ...t, badge: activeOrdersCount };
    }
    if (t.id === 'cart' && cartItemCount > 0) {
      return { ...t, badge: cartItemCount };
    }
    return t;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Role Switcher Demo Strip */}
      <View style={styles.roleBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Icon name="package" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>GrabnBite</Text>
        </View>

        {/* 4 User Roles Toggle */}
        <View style={styles.roleSelector}>
          <Pressable
            style={[
              styles.rolePill,
              currentRole === 'customer' && styles.rolePillActive,
            ]}
            onPress={() => switchRole('customer')}
          >
            <Text
              style={[
                styles.rolePillText,
                currentRole === 'customer' && styles.rolePillTextActive,
              ]}
            >
              Customer
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.rolePill,
              currentRole === 'restaurant' && styles.rolePillActive,
            ]}
            onPress={() => switchRole('restaurant')}
          >
            <Text
              style={[
                styles.rolePillText,
                currentRole === 'restaurant' && styles.rolePillTextActive,
              ]}
            >
              Restaurant
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.rolePill,
              currentRole === 'driver' && styles.rolePillActive,
            ]}
            onPress={() => switchRole('driver')}
          >
            <Text
              style={[
                styles.rolePillText,
                currentRole === 'driver' && styles.rolePillTextActive,
              ]}
            >
              Driver
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.rolePill,
              currentRole === 'admin' && styles.rolePillActive,
            ]}
            onPress={() => switchRole('admin')}
          >
            <Text
              style={[
                styles.rolePillText,
                currentRole === 'admin' && styles.rolePillTextActive,
              ]}
            >
              Admin
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.screenContainer}>
        {/* Toast Notification Banner */}
        {notification && (
          <Pressable style={styles.toastBanner} onPress={clearNotification}>
            <Icon name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.toastText} numberOfLines={2}>
              {notification}
            </Text>
            <Icon name="x" size={14} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Role 1: Customer */}
        {currentRole === 'customer' && (
          <View style={styles.roleWrapper}>
            {customerScreen === 'restaurant-details' && <RestaurantDetailsScreen />}
            {customerScreen === 'checkout' && <CheckoutScreen />}
            {customerScreen === 'payment' && <PaymentScreen />}
            {customerScreen === 'order-confirmation' && <OrderConfirmationScreen />}
            {customerScreen === 'order-tracking' && <OrderTrackingScreen />}
            {customerScreen === 'order-details' && <OrderDetailsScreen />}

            {(customerScreen === 'tabs' || customerScreen === 'cart') && (
              <View style={styles.tabContentContainer}>
                {(customerScreen === 'cart' || customerTab === 'cart') ? (
                  <CartScreen />
                ) : (
                  <>
                    {customerTab === 'home' && <CustomerHomeScreen />}
                    {customerTab === 'orders' && <CustomerOrdersScreen />}
                    {customerTab === 'profile' && <CustomerProfileScreen />}
                  </>
                )}

                <BottomTabBar
                  tabs={dynamicCustomerTabs}
                  activeTab={customerScreen === 'cart' ? 'cart' : customerTab}
                  onTabPress={id => {
                    setCustomerScreen('tabs');
                    setCustomerTab(id as any);
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* Role 2: Restaurant */}
        {currentRole === 'restaurant' && (
          <View style={styles.roleWrapper}>
            <View style={styles.tabContentContainer}>
              {restaurantTab === 'dashboard' && <RestaurantDashboardScreen />}
              {restaurantTab === 'orders' && <RestaurantOrdersScreen />}
              {restaurantTab === 'menu' && <RestaurantMenuScreen />}

              <BottomTabBar
                tabs={restaurantTabs}
                activeTab={restaurantTab}
                onTabPress={id => setRestaurantTab(id as any)}
              />
            </View>
          </View>
        )}

        {/* Role 3: Driver */}
        {currentRole === 'driver' && (
          <View style={styles.roleWrapper}>
            <View style={styles.tabContentContainer}>
              {driverTab === 'home' && <DriverHomeScreen />}
              {driverTab === 'delivery' && <DriverDeliveryScreen />}
              {driverTab === 'profile' && <DriverProfileScreen />}

              <BottomTabBar
                tabs={driverTabs}
                activeTab={driverTab}
                onTabPress={id => setDriverTab(id as any)}
              />
            </View>
          </View>
        )}

        {/* Role 4: Admin */}
        {currentRole === 'admin' && (
          <View style={styles.roleWrapper}>
            <AdminDashboardScreen />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AppProvider>
      <View style={styles.appShell}>
        <View style={styles.phoneFrame}>
          <MainNavigator />
        </View>
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 920,
    backgroundColor: THEME.colors.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: THEME.radii.full,
    padding: 2,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
  },
  rolePillActive: {
    backgroundColor: THEME.colors.primary,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    position: 'relative',
  },
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...THEME.shadows.card,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  roleWrapper: {
    flex: 1,
  },
  tabContentContainer: {
    flex: 1,
  },
});
