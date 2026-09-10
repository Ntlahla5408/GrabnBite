import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { THEME } from '../../theme';
import { ArrowLeft, Lock, Mail, UserCheck, Store, Bike, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  // const { setAuthScreen, login, setNotification } = useApp();
  const [email, setEmail] = useState('ntlahla@example.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    console.log("Please enter your email and password.");
    return;
  }

  try {
    const result = await login({
      email: email.trim(),
      password,
    });

    console.log("Login successful!");
    console.log("User:", result);
    console.log("Role:", result.role);
    console.log("Token:", result.token);

  } catch (error) {
    console.error(
      "Login error:",
      error instanceof Error ? error.message : error
    );
  }
};

  const handleSelectRoleDemo = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => setAuthScreen('welcome')}
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
        >
          <ArrowLeft size={24} color={THEME.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.greetingBox}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your details to sign in to your GrabnBite account</Text>
        </View>

        {/* Demo Role Selector Chips */}
        <View style={styles.roleSelectorBox}>
          <Text style={styles.roleLabel}>SIGN IN AS ROLE</Text>
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleTab, selectedRole === 'customer' && styles.roleTabActive]}
              onPress={() => handleSelectRoleDemo('customer', 'ntlahla@example.com')}
            >
              <UserCheck size={16} color={selectedRole === 'customer' ? '#FFFFFF' : THEME.colors.textSecondary} />
              <Text style={[styles.roleTabText, selectedRole === 'customer' && styles.roleTabTextActive]}>
                Customer
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleTab, selectedRole === 'restaurant' && styles.roleTabActive]}
              onPress={() => handleSelectRoleDemo('restaurant', 'orders@burgerhouse.co.za')}
            >
              <Store size={16} color={selectedRole === 'restaurant' ? '#FFFFFF' : THEME.colors.textSecondary} />
              <Text style={[styles.roleTabText, selectedRole === 'restaurant' && styles.roleTabTextActive]}>
                Restaurant
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleTab, selectedRole === 'driver' && styles.roleTabActive]}
              onPress={() => handleSelectRoleDemo('driver', 'thabo.driver@grabnbite.co.za')}
            >
              <Bike size={16} color={selectedRole === 'driver' ? '#FFFFFF' : THEME.colors.textSecondary} />
              <Text style={[styles.roleTabText, selectedRole === 'driver' && styles.roleTabTextActive]}>
                Driver
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleTab, selectedRole === 'admin' && styles.roleTabActive]}
              onPress={() => handleSelectRoleDemo('admin', 'admin@grabnbite.co.za')}
            >
              <ShieldCheck size={16} color={selectedRole === 'admin' ? '#FFFFFF' : THEME.colors.textSecondary} />
              <Text style={[styles.roleTabText, selectedRole === 'admin' && styles.roleTabTextActive]}>
                Admin
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          <Pressable
            style={styles.forgotPassword}
            onPress={() => setNotification('Password reset link sent to ' + email)}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>

          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
            onPress={handleLogin}
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Text style={styles.submitButtonText}>Login</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => setAuthScreen('register')}>
            <Text style={styles.footerLink}>Create account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  greetingBox: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  roleSelectorBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  roleTab: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleTabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.colors.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
