import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  Search,
  Star,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  Truck,
  Package,
  Store,
  Shield,
  LogOut,
  Edit2,
  X,
  Bell,
  ArrowRight,
  CreditCard,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Compass,
  Navigation,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';

export type IconName =
  | 'home'
  | 'shopping-bag'
  | 'shopping-cart'
  | 'user'
  | 'search'
  | 'star'
  | 'clock'
  | 'map-pin'
  | 'phone'
  | 'chevron-right'
  | 'chevron-left'
  | 'plus'
  | 'minus'
  | 'check'
  | 'truck'
  | 'package'
  | 'store'
  | 'shield'
  | 'log-out'
  | 'edit'
  | 'x'
  | 'bell'
  | 'arrow-right'
  | 'credit-card'
  | 'sliders'
  | 'check-circle'
  | 'alert-circle'
  | 'compass'
  | 'navigation'
  | 'refresh'
  | 'eye'
  | 'info';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<IconName, React.ComponentType<{ size?: number; color?: string }>> = {
  home: Home,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  user: User,
  search: Search,
  star: Star,
  clock: Clock,
  'map-pin': MapPin,
  phone: Phone,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  plus: Plus,
  minus: Minus,
  check: Check,
  truck: Truck,
  package: Package,
  store: Store,
  shield: Shield,
  'log-out': LogOut,
  edit: Edit2,
  x: X,
  bell: Bell,
  'arrow-right': ArrowRight,
  'credit-card': CreditCard,
  sliders: Sliders,
  'check-circle': CheckCircle2,
  'alert-circle': AlertCircle,
  compass: Compass,
  navigation: Navigation,
  refresh: RefreshCw,
  eye: Eye,
  info: Info,
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#111827' }) => {
  const Component = ICON_MAP[name] || Info;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Component size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
