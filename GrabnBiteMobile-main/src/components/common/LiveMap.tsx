import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '../../theme';
import { Icon } from './Icon';

interface LiveMapProps {
  restaurantName: string;
  customerAddress: string;
  driverName?: string;
  driverVehicle?: string;
  driverProgress?: number; // 0 (at restaurant) to 1 (at customer)
  height?: number;
  interactive?: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  restaurantName,
  customerAddress,
  driverName = 'Thabo Mokoena',
  driverVehicle = 'Toyota Corolla',
  driverProgress = 0.65,
  height = 240,
}) => {
  // Waypoint positions in percentage across the map container
  // Pickup: (20%, 30%), Delivery: (82%, 75%)
  const pickupX = 22;
  const pickupY = 28;
  const deliveryX = 80;
  const deliveryY = 76;

  // Intermediate curve waypoints to simulate real road turns
  // Turn 1: (45%, 28%), Turn 2: (45%, 65%), Turn 3: (70%, 65%), Turn 4: (80%, 76%)
  const getDriverCoordinates = (p: number) => {
    // Clamp 0 to 1
    const progress = Math.max(0, Math.min(1, p));
    if (progress <= 0.3) {
      // Leg 1: along horizontal top road
      const t = progress / 0.3;
      return { x: pickupX + (45 - pickupX) * t, y: pickupY };
    } else if (progress <= 0.6) {
      // Leg 2: along vertical avenue
      const t = (progress - 0.3) / 0.3;
      return { x: 45, y: pickupY + (65 - pickupY) * t };
    } else if (progress <= 0.85) {
      // Leg 3: along bottom road
      const t = (progress - 0.6) / 0.25;
      return { x: 45 + (70 - 45) * t, y: 65 };
    } else {
      // Leg 4: final approach to delivery
      const t = (progress - 0.85) / 0.15;
      return { x: 70 + (deliveryX - 70) * t, y: 65 + (deliveryY - 65) * t };
    }
  };

  const driverPos = getDriverCoordinates(driverProgress);
  const percentComplete = Math.round(driverProgress * 100);

  return (
    <View style={[styles.container, { height }]}>
      {/* Map Background Grid & City Blocks */}
      <View style={styles.mapGrid}>
        {/* City blocks */}
        <View style={[styles.block, { top: '8%', left: '8%', width: '32%', height: '16%' }]} />
        <View style={[styles.block, { top: '34%', left: '8%', width: '32%', height: '38%' }]} />
        <View style={[styles.blockPark, { top: '8%', left: '50%', width: '42%', height: '24%' }]} />
        <View style={[styles.block, { top: '38%', left: '50%', width: '42%', height: '24%' }]} />
        <View style={[styles.block, { top: '70%', left: '8%', width: '32%', height: '22%' }]} />

        {/* Major Roads */}
        {/* Horizontal Road 1 */}
        <View style={[styles.roadHorizontal, { top: `${pickupY}%` }]} />
        {/* Horizontal Road 2 */}
        <View style={[styles.roadHorizontal, { top: '65%' }]} />
        {/* Vertical Avenue */}
        <View style={[styles.roadVertical, { left: '45%' }]} />
        {/* Secondary Vertical Avenue */}
        <View style={[styles.roadVertical, { left: '70%' }]} />

        {/* Route highlight layer */}
        {/* Leg 1: Pickup to turn */}
        <View
          style={[
            styles.routeLine,
            {
              top: `${pickupY - 1.5}%`,
              left: `${pickupX}%`,
              width: `${45 - pickupX}%`,
              height: 5,
            },
          ]}
        />
        {/* Leg 2: Turn down */}
        <View
          style={[
            styles.routeLine,
            {
              top: `${pickupY}%`,
              left: '44.5%',
              width: 5,
              height: '37%',
            },
          ]}
        />
        {/* Leg 3: Turn right */}
        <View
          style={[
            styles.routeLine,
            {
              top: '64.5%',
              left: '45%',
              width: '25%',
              height: 5,
            },
          ]}
        />
        {/* Leg 4: Final diagonal approach */}
        <View
          style={[
            styles.routeLine,
            {
              top: '65%',
              left: '70%',
              width: '11%',
              height: 5,
              transform: [{ rotate: '42deg' }],
            },
          ]}
        />
      </View>

      {/* Restaurant Pickup Marker */}
      <View style={[styles.markerContainer, { left: `${pickupX}%`, top: `${pickupY}%` }]}>
        <View style={styles.restaurantMarker}>
          <Icon name="store" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {restaurantName}
          </Text>
        </View>
      </View>

      {/* Customer Delivery Marker */}
      <View style={[styles.markerContainer, { left: `${deliveryX}%`, top: `${deliveryY}%` }]}>
        <View style={styles.customerMarker}>
          <Icon name="map-pin" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            Delivery Address
          </Text>
        </View>
      </View>

      {/* Live Moving Driver Marker */}
      <View
        style={[
          styles.driverMarkerContainer,
          {
            left: `${driverPos.x}%`,
            top: `${driverPos.y}%`,
          },
        ]}
      >
        <View style={styles.pulseRing} />
        <View style={styles.driverMarker}>
          <Icon name="truck" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.driverTag}>
          <Text style={styles.driverTagText}>{driverName.split(' ')[0]}</Text>
        </View>
      </View>

      {/* Top telemetry overlay */}
      <View style={styles.telemetryCard}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>GPS LIVE</Text>
        </View>
        <Text style={styles.telemetryDistance}>
          {driverProgress >= 0.95 ? 'Arrived!' : `${(2.8 * (1 - driverProgress)).toFixed(1)} km away`}
        </Text>
      </View>

      {/* Bottom map watermark */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>Live SignalR / Redis GPS Telemetry</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E8ECF2',
    borderRadius: THEME.radii.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EDF1F5',
  },
  block: {
    position: 'absolute',
    backgroundColor: '#DFE5EC',
    borderRadius: 6,
  },
  blockPark: {
    position: 'absolute',
    backgroundColor: '#D1E7DD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C0DCB9',
  },
  roadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: -9 }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D4DCE6',
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -10 }],
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D4DCE6',
  },
  routeLine: {
    position: 'absolute',
    backgroundColor: THEME.colors.primary,
    borderRadius: 3,
    zIndex: 2,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -32 }],
    zIndex: 4,
  },
  restaurantMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  customerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerLabel: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  markerLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  driverMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 87, 34, 0.25)',
    top: -5,
    left: -5,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  driverTag: {
    backgroundColor: THEME.colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  driverTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  telemetryCard: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  telemetryDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  watermark: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  watermarkText: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
});
