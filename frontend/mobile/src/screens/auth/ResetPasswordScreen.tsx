import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useMobileAuthStore } from '../../stores/mobile-auth.store.js';
import { Input } from '../../components/Input.js';
import { Button } from '../../components/Button.js';
import { Card } from '../../components/Card.js';

export interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onBackToLogin,
}) => {
  const { resetPassword, isLoading, error } = useMobileAuthStore();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!token.trim() || !newPassword) {
      setFormError('Token and new password are required');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    const ok = await resetPassword({
      token: token.trim(),
      newPassword,
    });

    if (ok) {
      setSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Set New Password</Text>
          <Text style={styles.subtitle}>Enter the reset token and choose a strong password</Text>
        </View>

        <Card style={styles.card}>
          {(error || formError) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{formError || error}</Text>
            </View>
          )}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successDesc}>
                Your password has been reset successfully. You can now sign in with your new credentials.
              </Text>
              <Button
                title="Go to Sign In"
                onPress={onBackToLogin}
                style={styles.submitBtn}
              />
            </View>
          ) : (
            <>
              <Input
                label="Reset Token"
                placeholder="Paste token received"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />

              <Input
                label="New Password"
                placeholder="Min 8 chars with uppercase, number, symbol"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Button
                title="Update Password"
                onPress={handleSubmit}
                isLoading={isLoading}
                style={styles.submitBtn}
              />
            </>
          )}
        </Card>

        {!success && (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
            <Text style={styles.backBtnText}>← Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    padding: 20,
  },
  errorBanner: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: 12,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
