import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { Utensils, ArrowRight, ShieldCheck, Bike, Store, UserCheck } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setAuthScreen, login } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Top Hero Brand */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Utensils size={44} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>GrabnBite</Text>
          <Text style={styles.tagline}>Good food. Delivered.</Text>
        </View>

        {/* Food Illustration / Imagery */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Main Authentication Actions */}
        <View style={styles.actionSection}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => setAuthScreen('login')}
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Text style={styles.primaryButtonText}>Login</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => setAuthScreen('register')}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </Pressable>

          {/* Quick Demo Role Logins for rapid testing */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>QUICK DEMO SIGN-IN</Text>
            <View style={styles.demoRow}>
              <Pressable
                style={styles.demoChip}
                onPress={() => login('ntlahla@example.com', 'customer')}
              >
                <UserCheck size={14} color={THEME.colors.primary} />
                <Text style={styles.demoChipText}>Customer</Text>
              </Pressable>

              <Pressable
                style={styles.demoChip}
                onPress={() => login('orders@burgerhouse.co.za', 'restaurant')}
              >
                <Store size={14} color={THEME.colors.primary} />
                <Text style={styles.demoChipText}>Restaurant</Text>
              </Pressable>

              <Pressable
                style={styles.demoChip}
                onPress={() => login('thabo.driver@grabnbite.co.za', 'driver')}
              >
                <Bike size={14} color={THEME.colors.primary} />
                <Text style={styles.demoChipText}>Driver</Text>
              </Pressable>

              <Pressable
                style={styles.demoChip}
                onPress={() => login('admin@grabnbite.co.za', 'admin')}
              >
                <ShieldCheck size={14} color={THEME.colors.primary} />
                <Text style={styles.demoChipText}>Admin</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
    marginTop: 6,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  actionSection: {
    width: '100%',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primaryDark,
  },
});
