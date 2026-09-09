import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '../../theme';
import { Icon, IconName } from '../common/Icon';

export interface TabItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const color = isActive ? THEME.colors.primary : THEME.colors.textMuted;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
          >
            <View style={styles.iconWrapper}>
              <Icon name={tab.icon} size={22} color={color} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    ...THEME.shadows.bottomBar,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: THEME.colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
  },
});
