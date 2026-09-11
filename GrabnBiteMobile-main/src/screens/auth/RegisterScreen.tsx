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
import { ArrowLeft, Lock, Mail, Phone, User } from 'lucide-react';

export const RegisterScreen: React.FC = () => {
  const { setAuthScreen, register, setNotification } = useApp();

  const [firstName, setFirstName] = useState('Ntlahla');
  const [lastName, setLastName] = useState('Mokoena');
  const [email, setEmail] = useState('ntlahla@example.com');
  const [phone, setPhone] = useState('+27 82 555 0192');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setNotification('Please enter your first and last name');
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setNotification('Please enter your email and phone number');
      return;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setNotification('Passwords do not match');
      return;
    }

    register(firstName, lastName, email, phone);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => setAuthScreen('welcome')}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={24} color={THEME.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.greetingBox}>
          <Text style={styles.title}>Join GrabnBite</Text>
          <Text style={styles.subtitle}>Order from your favourite local restaurants in seconds</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={THEME.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ntlahla"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={THEME.colors.textTertiary}
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mokoena"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={THEME.colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ntlahla@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={18} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+27 82 555 0192"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={THEME.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={THEME.colors.textTertiary}
              />
            </View>
          </View>

          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
            onPress={handleRegister}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            <Text style={styles.submitButtonText}>Create Account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => setAuthScreen('login')}>
            <Text style={styles.footerLink}>Login</Text>
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
  placeholder: {
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
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 15,
    color: THEME.colors.text,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
    marginTop: 28,
    marginBottom: 20,
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
