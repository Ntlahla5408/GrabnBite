import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import {
  changeMyPassword,
  deleteMyProfilePhoto,
  getMyProfile,
  requestEmailChange,
  updateMyProfile,
  uploadMyProfilePhoto,
  verifyEmailChange,
} from "../services/userService";

export default function AccountSettingsScreen() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await getMyProfile(token);
      await updateUser(profile);
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setPhoneNumber(profile.phoneNumber ?? "");
      setEmail(profile.email ?? "");
      setProfileImageUrl(profile.profileImageUrl ?? null);
      setNewEmail(profile.email ?? "");
      setError("");
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load your account details.");
    } finally {
      setLoading(false);
    }
  }, [token, updateUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the authenticated profile when this screen opens.
      void loadProfile();
    }
  }, [authLoading, token, user, loadProfile]);

  function showMessage(value: string) {
    setError("");
    setMessage(value);
  }

  function showError(value: string) {
    setMessage("");
    setError(value);
  }

  async function saveProfile() {
    if (!token || !user) return;
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      showError("First name, last name and phone number are required.");
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await updateMyProfile(user.userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        phoneNumber: phoneNumber.trim(),
      }, token);
      await updateUser(updated);
      showMessage("Your personal details have been saved.");
    } catch (saveError: any) {
      showError(saveError?.message || "Unable to save your personal details.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function chooseProfilePhoto() {
    if (!token) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError("Allow photo library access to choose a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    try {
      setUploadingPhoto(true);
      const uploaded = await uploadMyProfilePhoto({
        uri: asset.uri,
        name: asset.fileName ?? "grabnbite-profile.jpg",
        type: asset.mimeType ?? "image/jpeg",
      }, token);
      setProfileImageUrl(uploaded.profileImageUrl);
      await updateUser({ ...user!, profileImageUrl: uploaded.profileImageUrl });
      showMessage("Your profile picture has been updated.");
    } catch (uploadError: any) {
      showError(uploadError?.message || "Unable to upload your profile picture.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function removeProfilePhoto() {
    if (!token || !profileImageUrl) return;
    try {
      setUploadingPhoto(true);
      await deleteMyProfilePhoto(token);
      setProfileImageUrl(null);
      await updateUser({ ...user!, profileImageUrl: null });
      showMessage("Your profile picture has been removed.");
    } catch (removeError: any) {
      showError(removeError?.message || "Unable to remove your profile picture.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function sendEmailVerification() {
    if (!token || !emailPassword.trim() || !newEmail.trim()) {
      showError("Enter your current password and the new email address.");
      return;
    }
    try {
      setSavingEmail(true);
      const result = await requestEmailChange(emailPassword, newEmail.trim(), token);
      setPendingEmail(result.targetEmail);
      setVerificationCode("");
      setEmailPassword("");
      showMessage(result.message);
    } catch (emailError: any) {
      showError(emailError?.message || "Unable to request an email change.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function confirmEmailChange() {
    if (!token || !verificationCode.trim()) {
      showError("Enter the six-digit verification code.");
      return;
    }
    try {
      setSavingEmail(true);
      const result = await verifyEmailChange(verificationCode.trim(), token);
      await updateUser(result.user);
      setEmail(result.user.email);
      setNewEmail(result.user.email);
      setPendingEmail("");
      setVerificationCode("");
      showMessage(result.message);
    } catch (verifyError: any) {
      showError(verifyError?.message || "Unable to verify the new email address.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePassword() {
    if (!token || !currentPassword || !newPassword || !confirmPassword) {
      showError("Complete all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("The new password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      showError("Your new password must contain at least 8 characters.");
      return;
    }
    try {
      setSavingPassword(true);
      const result = await changeMyPassword(currentPassword, newPassword, token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage(result.message);
    } catch (passwordError: any) {
      showError(passwordError?.message || "Unable to update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (authLoading || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading account...</Text>
      </View>
    );
  }
  if (!user || !token) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹  My Account</Text>
        </Pressable>
        <Text style={[styles.heading, { color: colors.headerText }]}>Personal account</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Update your details, email, password and profile picture
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {(message || error) ? (
          <View style={[styles.feedback, { backgroundColor: error ? "#FEE2E2" : "#DCFCE7" }]}>
            <Text style={{ color: error ? "#991B1B" : "#166534", lineHeight: 20 }}>
              {error || message}
            </Text>
          </View>
        ) : null}

        <Section title="Profile picture" colors={colors}>
          <View style={styles.photoRow}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase() || "U"}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                This picture represents your personal GrabnBite account.
              </Text>
              <Pressable style={[styles.smallButton, { backgroundColor: colors.accent }]} onPress={chooseProfilePhoto} disabled={uploadingPhoto}>
                <Text style={styles.smallButtonText}>{uploadingPhoto ? "Please wait..." : profileImageUrl ? "Change picture" : "Upload picture"}</Text>
              </Pressable>
              {profileImageUrl ? (
                <Pressable onPress={removeProfilePhoto} disabled={uploadingPhoto} style={{ paddingVertical: 9 }}>
                  <Text style={styles.removeText}>Remove picture</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <Text style={[styles.helper, { color: colors.textSecondary }]}>JPEG, PNG or WebP. Maximum file size: 5 MB.</Text>
        </Section>

        <Section title="Personal details" colors={colors}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} colors={colors} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} colors={colors} />
          <Field label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" colors={colors} />
          <Field label="Account type" value={user.role} editable={false} colors={colors} />
          <ActionButton title="Save personal details" onPress={saveProfile} loading={savingProfile} colors={colors} />
        </Section>

        <Section title="Email address" colors={colors}>
          <Field label="Current email address" value={email} editable={false} colors={colors} />
          <Field label="New email address" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" colors={colors} />
          {!pendingEmail ? (
            <>
              <Field label="Current password" value={emailPassword} onChangeText={setEmailPassword} secureTextEntry colors={colors} />
              <Text style={[styles.helper, { color: colors.textSecondary }]}>
                We will send a six-digit verification code to the new address. Your current email stays active until the new one is verified.
              </Text>
              <ActionButton title="Send verification code" onPress={sendEmailVerification} loading={savingEmail} colors={colors} />
            </>
          ) : (
            <>
              <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                Verification code sent to {pendingEmail}
              </Text>
              <Field label="Six-digit verification code" value={verificationCode} onChangeText={setVerificationCode} keyboardType="numeric" colors={colors} />
              <ActionButton title="Verify and update email" onPress={confirmEmailChange} loading={savingEmail} colors={colors} />
            </>
          )}
        </Section>

        <Section title="Change password" colors={colors}>
          <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry colors={colors} />
          <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry colors={colors} />
          <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry colors={colors} />
          <Text style={[styles.helper, { color: colors.textSecondary }]}>Use at least 8 characters. Your current password is required to make this change.</Text>
          <ActionButton title="Update password" onPress={savePassword} loading={savingPassword} colors={colors} />
        </Section>
      </ScrollView>
    </View>
  );
}

type ThemeColors = typeof AppThemeColors[keyof typeof AppThemeColors];

function Section({ title, colors, children }: { title: string; colors: ThemeColors; children: ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label, value, onChangeText, colors, editable = true, secureTextEntry = false,
  keyboardType = "default", autoCapitalize = "sentences",
}: {
  label: string; value: string; onChangeText?: (value: string) => void;
  colors: typeof AppThemeColors.light; editable?: boolean; secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }, !editable && styles.readOnly]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        placeholder={label}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

function ActionButton({ title, onPress, loading, colors }: {
  title: string; onPress: () => void; loading: boolean; colors: ThemeColors;
}) {
  return (
    <Pressable style={[styles.actionButton, { backgroundColor: colors.accent }, loading && styles.disabled]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionButtonText}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 28 },
  back: { color: "#FDBA74", fontWeight: "700", marginBottom: 15 },
  heading: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, marginTop: 6 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 60 },
  feedback: { borderRadius: 10, padding: 13, marginBottom: 14 },
  section: { borderWidth: 1, borderRadius: 15, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 14 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#F1F5F9" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#F97316" },
  avatarInitial: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  cardDescription: { fontSize: 13, lineHeight: 19, marginBottom: 9 },
  smallButton: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  smallButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  removeText: { color: "#B91C1C", fontWeight: "700", fontSize: 12 },
  helper: { fontSize: 12, lineHeight: 18, marginTop: 2, marginBottom: 10 },
  field: { marginBottom: 13 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 14 },
  readOnly: { opacity: 0.72 },
  actionButton: { minHeight: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 11, marginTop: 3 },
  actionButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  pendingText: { fontSize: 13, marginBottom: 12 },
  disabled: { opacity: 0.65 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
