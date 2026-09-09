export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  defaultAddressId?: string;
  restaurantId?: string;
  driverId?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number; // in Rands (e.g. 95)
  category: string;
  image: string;
  isAvailable: boolean;
  popular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  isApproved?: boolean;
  deliveryFee: number;
  deliveryTime: string; // e.g. "20-30 min"
  minOrder: number;
  image: string;
  bannerImage: string;
  address: string;
  phone?: string;
  email?: string;
  location?: string;
  categories: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picking_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
  isDefault?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
  vehicleReg: string;
  rating: number;
  totalDeliveries: number;
  isOnline: boolean;
  isApproved: boolean;
  currentLat: number;
  currentLng: number;
  avatar: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: Address;
  paymentMethod: string;
  createdAt: string;
  estimatedDeliveryTime: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverRating?: number;
  driverAvatar?: string;
  // Live GPS progression (0 to 1)
  driverProgress?: number; // 0 = at restaurant, 1 = at customer
}
