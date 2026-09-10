import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import {
  User,
  UserRole,
  Restaurant,
  MenuItem,
  CartItem,
  Order,
  OrderStatus,
  Driver,
  Address,
} from '../types';
import {
  MOCK_USERS,
  MOCK_RESTAURANTS,
  MOCK_MENU_ITEMS,
  MOCK_DRIVERS,
  MOCK_ADDRESSES,
  INITIAL_ORDERS,
} from '../data/mockData';

export type CustomerScreenType =
  | 'tabs'
  | 'restaurant-details'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'order-confirmation'
  | 'order-tracking'
  | 'order-details';

export type AuthScreenType = 'welcome' | 'login' | 'register';

interface AppContextType {
  // Authentication
  isAuthenticated: boolean;
  authScreen: AuthScreenType;
  setAuthScreen: (screen: AuthScreenType) => void;
login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, phone: string) => void;
  logout: () => void;
  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;

  // Customer navigation
  customerTab: 'home' | 'orders' | 'cart' | 'profile';
  setCustomerTab: (tab: 'home' | 'orders' | 'cart' | 'profile') => void;
  customerScreen: CustomerScreenType;
  setCustomerScreen: (screen: CustomerScreenType) => void;
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
  trackingOrderId: string | null;
  setTrackingOrderId: (id: string | null) => void;
  selectedOrderDetailsId: string | null;
  setSelectedOrderDetailsId: (id: string | null) => void;

  // Payment flow
  lastPlacedOrder: Order | null;
  paymentProcessing: boolean;
  paymentResult: 'success' | 'failed' | null;
  processPayment: (shouldFail?: boolean) => Promise<boolean>;

  // Restaurant navigation
  restaurantTab: 'dashboard' | 'orders' | 'menu' | 'profile';
  setRestaurantTab: (tab: 'dashboard' | 'orders' | 'menu' | 'profile') => void;

  // Driver navigation
  driverTab: 'home' | 'delivery' | 'profile';
  setDriverTab: (tab: 'home' | 'delivery' | 'profile') => void;

  // Admin navigation
  adminTab: 'dashboard' | 'restaurants' | 'drivers' | 'deliveries';
  setAdminTab: (tab: 'dashboard' | 'restaurants' | 'drivers' | 'deliveries') => void;
  approveRestaurant: (restaurantId: string) => void;
  toggleRestaurantApproval: (restaurantId: string) => void;
  approveDriver: (driverId: string) => void;
  toggleDriverApproval: (driverId: string) => void;

  // Data
  restaurants: Restaurant[];
  toggleRestaurantOpen: (restaurantId: string) => void;
  menuItems: MenuItem[];
  toggleItemAvailability: (itemId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  clearAndAddToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartRestaurant: Restaurant | null;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  cartItemCount: number;

  // Addresses & Payments
  addresses: Address[];
  selectedAddress: Address;
  setSelectedAddress: (addr: Address) => void;
  addAddress: (addr: Omit<Address, 'id'>) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;

  // Orders
  orders: Order[];
  createPendingOrder: () => Order;
  acceptOrder: (orderId: string) => void;
  startPreparing: (orderId: string) => void;
  readyForPickup: (orderId: string) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  acceptDelivery: (orderId: string) => void;
  confirmPickup: (orderId: string) => void;
  pickupOrder: (orderId: string) => void;
  startDelivery: (orderId: string) => void;
  sendLiveLocation: (orderId: string) => void;
  completeDelivery: (orderId: string) => void;

  // Drivers
  drivers: Driver[];
  currentDriver: Driver;
  toggleDriverOnline: () => void;

  // 27-Step Demo Guide
  demoStep: number;
  setDemoStep: (step: number) => void;
  showDemoGuide: boolean;
  setShowDemoGuide: (show: boolean) => void;
  resetDemoToStart: () => void;

  // Global toast
  notification: string | null;
  setNotification: (msg: string | null) => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state - initialized as authenticated for seamless preview, but full Welcome/Login/Register accessible
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authScreen, setAuthScreen] = useState<AuthScreenType>('welcome');
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS.customer);

  // Customer navigation state
  const [customerTab, setCustomerTab] = useState<'home' | 'orders' | 'cart' | 'profile'>('home');
  const [customerScreen, setCustomerScreen] = useState<CustomerScreenType>('tabs');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>('rest_1');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [selectedOrderDetailsId, setSelectedOrderDetailsId] = useState<string | null>(null);

  // Payment flow state
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);

  // Restaurant navigation state
  const [restaurantTab, setRestaurantTab] = useState<'dashboard' | 'orders' | 'menu' | 'profile'>('dashboard');

  // Driver navigation state
  const [driverTab, setDriverTab] = useState<'home' | 'delivery' | 'profile'>('home');

  // Admin navigation state
  const [adminTab, setAdminTab] = useState<'dashboard' | 'restaurants' | 'drivers' | 'deliveries'>('dashboard');

  // Data states
  const [restaurants, setRestaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState<Address>(MOCK_ADDRESSES[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Card (•••• 4582)');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Demo step tracking (1 to 27)
  const [demoStep, setDemoStep] = useState<number>(1);
  const [showDemoGuide, setShowDemoGuide] = useState<boolean>(true);

  // Auto-clear notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time GPS movement simulation for orders 'on_the_way'
  // Simulates Driver React Native App -> PUT /api/Delivery/{deliveryId}/location -> SignalR DriverLocationUpdated
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.status === 'on_the_way') {
            const current = order.driverProgress ?? 0.3;
            if (current < 1) {
              const next = Math.min(1, current + 0.05);
              return {
                ...order,
                driverProgress: next,
              };
            }
          }
          return order;
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Authentication methods
  const login = async (
  email: string,
  password: string
) => {
  try {
    const response = await authService.login(
      email,
      password
    );

    const backendRole = response.role.toLowerCase();

    let role: UserRole;

    switch (backendRole) {
      case 'admin':
        role = 'admin';
        break;

      case 'restaurant':
        role = 'restaurant';
        break;

      case 'driver':
        role = 'driver';
        break;

      case 'customer':
      default:
        role = 'customer';
        break;
    }

    const loggedInUser = {
      id: response.userId.toString(),
      name: `${response.firstName} ${response.lastName}`,
      email: response.email,
      role,
    };

    setCurrentUser(loggedInUser);
    setCurrentRole(role);
    setIsAuthenticated(true);

    setNotification(
      `Welcome back, ${response.firstName}!`
    );

  } catch (error) {
    setNotification(
      error instanceof Error
        ? error.message
        : 'Login failed. Please check your credentials.'
    );
  }
};

  const register = (firstName: string, lastName: string, email: string, phone: string) => {
    const newUser: User = {
      id: `user_cust_${Date.now()}`,
      name: `${firstName} ${lastName}`.trim() || 'Ntlahla',
      email: email.trim() || 'ntlahla@example.com',
      phone: phone.trim() || '+27 82 555 0192',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      defaultAddressId: 'addr_1',
    };
    setCurrentUser(newUser);
    setCurrentRole('customer');
    setIsAuthenticated(true);
    setNotification(`Welcome to GrabnBite, ${newUser.name}!`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthScreen('welcome');
    setNotification('Logged out successfully');
  };

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setCurrentUser(MOCK_USERS[newRole] || MOCK_USERS.customer);
    setNotification(`Switched view to ${newRole.toUpperCase()} mode`);
  };

  // Restaurant actions
  const toggleRestaurantOpen = (restaurantId: string) => {
    setRestaurants(prev =>
      prev.map(r => (r.id === restaurantId ? { ...r, isOpen: !r.isOpen } : r))
    );
  };

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `menu_${Date.now()}`,
    };
    setMenuItems(prev => [newItem, ...prev]);
    setNotification(`Added "${newItem.name}" to menu`);
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setNotification(`Updated "${updatedItem.name}"`);
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (cart.length > 0 && cart[0].menuItem.restaurantId !== item.restaurantId) {
      const existingRest = restaurants.find(r => r.id === cart[0].menuItem.restaurantId);
      const existingName = existingRest ? existingRest.name : 'another restaurant';
      setNotification(`Cart has items from ${existingName}. Clear your cart first to switch.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setNotification(`Added 1x ${item.name} to cart`);
  };

  const clearAndAddToCart = (item: MenuItem) => {
    setCart([{ menuItem: item, quantity: 1 }]);
    setNotification(`Started new cart with ${item.name}`);
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(ci => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartRestaurant = useMemo(() => {
    if (cart.length === 0) return null;
    const restId = cart[0].menuItem.restaurantId;
    return restaurants.find(r => r.id === restId) || null;
  }, [cart, restaurants]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const cartDeliveryFee = useMemo(() => {
    return cartRestaurant ? cartRestaurant.deliveryFee : 25;
  }, [cartRestaurant]);

  const cartTotal = useMemo(() => {
    return cart.length > 0 ? cartSubtotal + cartDeliveryFee : 0;
  }, [cartSubtotal, cartDeliveryFee, cart.length]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addAddress = (newAddr: Omit<Address, 'id'>) => {
    const addr: Address = {
      ...newAddr,
      id: `addr_${Date.now()}`,
    };
    setAddresses(prev => [...prev, addr]);
    setSelectedAddress(addr);
    setNotification('Delivery address saved');
  };

  // Order Creation & Payment
  const createPendingOrder = (): Order => {
    if (!cartRestaurant || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Use prompt's standard order number #1042 if not taken, or sequential
    const orderNum = orders.some(o => o.orderNumber === '#1042')
      ? `#${Math.floor(1043 + Math.random() * 8000)}`
      : '#1042';

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: orderNum,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      restaurantId: cartRestaurant.id,
      restaurantName: cartRestaurant.name,
      restaurantAddress: cartRestaurant.address,
      items: cart.map(ci => ({
        id: ci.menuItem.id,
        name: ci.menuItem.name,
        price: ci.menuItem.price,
        quantity: ci.quantity,
      })),
      subtotal: cartSubtotal,
      deliveryFee: cartDeliveryFee,
      total: cartTotal,
      status: 'placed',
      deliveryAddress: selectedAddress,
      paymentMethod: selectedPaymentMethod,
      createdAt: 'Just now',
      estimatedDeliveryTime: '25–35 minutes',
      driverProgress: 0,
    };

    setLastPlacedOrder(newOrder);
    return newOrder;
  };

  const processPayment = async (shouldFail: boolean = false): Promise<boolean> => {
    setPaymentProcessing(true);
    setPaymentResult(null);

    return new Promise(resolve => {
      setTimeout(() => {
        setPaymentProcessing(false);
        if (shouldFail) {
          setPaymentResult('failed');
          setNotification('Payment failed. Your order has not been paid.');
          resolve(false);
        } else {
          setPaymentResult('success');
          if (lastPlacedOrder) {
            setOrders(prev => [lastPlacedOrder, ...prev]);
            setTrackingOrderId(lastPlacedOrder.id);
            clearCart();
            setNotification(`Payment successful! Order ${lastPlacedOrder.orderNumber} placed.`);
          }
          resolve(true);
        }
      }, 1200);
    });
  };

  // Workflow steps
  const acceptOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'accepted' } : o))
    );
    setNotification('Order accepted by restaurant');
  };

  const startPreparing = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'preparing' } : o))
    );
    setNotification('Kitchen started preparing order');
  };

  const readyForPickup = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'ready_for_pickup' } : o))
    );
    setNotification('Order marked Ready for Pickup');
  };

  const assignDriver = (orderId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'picking_up',
              driverId: driver.id,
              driverName: driver.name,
              driverPhone: driver.phone,
              driverVehicle: driver.vehicle,
              driverRating: driver.rating,
              driverAvatar: driver.avatar,
              driverProgress: 0.1,
            }
          : o
      )
    );
    setNotification(`Driver ${driver.name} assigned to delivery`);
  };

  const acceptDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'picking_up', driverProgress: 0.15 }
          : o
      )
    );
    setNotification('Delivery accepted. Please proceed to restaurant for pickup.');
  };

  const confirmPickup = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'picking_up', driverProgress: 0.25 }
          : o
      )
    );
    setNotification('Pickup confirmed. You have collected the order.');
  };

  const pickupOrder = (orderId: string) => {
    confirmPickup(orderId);
  };

  const startDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'on_the_way', driverProgress: 0.35 }
          : o
      )
    );
    setNotification('Delivery started! GPS tracking active.');
  };

  const sendLiveLocation = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const nextProg = Math.min(0.95, (o.driverProgress || 0.35) + 0.15);
          return { ...o, driverProgress: nextProg };
        }
        return o;
      })
    );
    setNotification('Live GPS location packet broadcast (SignalR Event: DriverLocationChanged)');
  };

  const completeDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'delivered', driverProgress: 1, estimatedDeliveryTime: 'Delivered' }
          : o
      )
    );
    setNotification('Delivery completed successfully!');
  };

  // Driver operations
  const currentDriver = drivers[0];
  const toggleDriverOnline = () => {
    setDrivers(prev =>
      prev.map(d => (d.id === currentDriver.id ? { ...d, isOnline: !d.isOnline } : d))
    );
    setNotification(currentDriver.isOnline ? "You're now offline" : "You're online");
  };

  // Admin operations
  const approveRestaurant = (restaurantId: string) => {
    setRestaurants(prev =>
      prev.map(r => (r.id === restaurantId ? { ...r, isApproved: true } : r))
    );
    setNotification('Restaurant approved successfully');
  };

  const toggleRestaurantApproval = (restaurantId: string) => {
    setRestaurants(prev =>
      prev.map(r => (r.id === restaurantId ? { ...r, isApproved: !r.isApproved } : r))
    );
  };

  const approveDriver = (driverId: string) => {
    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, isApproved: true } : d))
    );
    setNotification('Driver approved successfully');
  };

  const toggleDriverApproval = (driverId: string) => {
    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, isApproved: !d.isApproved } : d))
    );
  };

  const resetDemoToStart = () => {
    setOrders(INITIAL_ORDERS);
    setCart([]);
    setCustomerScreen('tabs');
    setCustomerTab('home');
    setCurrentRole('customer');
    setCurrentUser(MOCK_USERS.customer);
    setTrackingOrderId(null);
    setLastPlacedOrder(null);
    setPaymentResult(null);
    setDemoStep(1);
    setNotification('Reset demo scenario to initial state');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authScreen,
        setAuthScreen,
        login,
        register,
        logout,
        currentUser,
        currentRole,
        switchRole,
        customerTab,
        setCustomerTab,
        customerScreen,
        setCustomerScreen,
        selectedRestaurantId,
        setSelectedRestaurantId,
        trackingOrderId,
        setTrackingOrderId,
        selectedOrderDetailsId,
        setSelectedOrderDetailsId,
        lastPlacedOrder,
        paymentProcessing,
        paymentResult,
        processPayment,
        restaurantTab,
        setRestaurantTab,
        driverTab,
        setDriverTab,
        adminTab,
        setAdminTab,
        approveRestaurant,
        toggleRestaurantApproval,
        approveDriver,
        toggleDriverApproval,
        restaurants,
        toggleRestaurantOpen,
        menuItems,
        toggleItemAvailability,
        addMenuItem,
        updateMenuItem,
        cart,
        addToCart,
        clearAndAddToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartRestaurant,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,
        cartItemCount,
        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        orders,
        createPendingOrder,
        acceptOrder,
        startPreparing,
        readyForPickup,
        assignDriver,
        acceptDelivery,
        confirmPickup,
        pickupOrder,
        startDelivery,
        sendLiveLocation,
        completeDelivery,
        drivers,
        currentDriver,
        toggleDriverOnline,
        demoStep,
        setDemoStep,
        showDemoGuide,
        setShowDemoGuide,
        resetDemoToStart,
        notification,
        setNotification,
        clearNotification: () => setNotification(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
