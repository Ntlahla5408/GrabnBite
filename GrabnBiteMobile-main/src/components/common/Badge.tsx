import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { OrderStatus } from '../../types';
import { THEME } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.label, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {label}
      </Text>
    </View>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const config: Record<
    OrderStatus,
    { label: string; variant: 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'danger' }
  > = {
    placed: { label: 'Order Placed', variant: 'info' },
    accepted: { label: 'Accepted', variant: 'info' },
    preparing: { label: 'Preparing Food', variant: 'warning' },
    ready_for_pickup: { label: 'Ready for Pickup', variant: 'warning' },
    picking_up: { label: 'Driver Picking Up', variant: 'primary' },
    on_the_way: { label: 'On The Way', variant: 'primary' },
    delivered: { label: 'Delivered', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
  };

  const item = config[status] || { label: status, variant: 'neutral' };
  return <Badge label={item.label} variant={item.variant} size="sm" />;
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: THEME.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  size_md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  primary: {
    backgroundColor: THEME.colors.primaryLight,
  },
  success: {
    backgroundColor: THEME.colors.successLight,
  },
  warning: {
    backgroundColor: THEME.colors.warningLight,
  },
  info: {
    backgroundColor: THEME.colors.infoLight,
  },
  danger: {
    backgroundColor: THEME.colors.dangerLight,
  },
  neutral: {
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  label: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 13,
  },
  text_primary: {
    color: THEME.colors.primary,
  },
  text_success: {
    color: THEME.colors.success,
  },
  text_warning: {
    color: THEME.colors.warning,
  },
  text_info: {
    color: THEME.colors.info,
  },
  text_danger: {
    color: THEME.colors.danger,
  },
  text_neutral: {
    color: THEME.colors.textSecondary,
  },
});
