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

export interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onNavigateReset: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
  onNavigateReset,
}) => {
  const { forgotPassword, isLoading, error } = useMobileAuthStore();

  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;

    const ok = await forgotPassword({ email: email.trim().toLowerCase() });
    if (ok) {
      setSuccessMessage('Password reset instructions have been generated.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your account email to receive a password reset token
          </Text>
        </View>

        <Card style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          )}

          <Input
            label="Account Email"
            placeholder="player@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Button
            title="Send Reset Token"
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            style={styles.haveTokenBtn}
            onPress={onNavigateReset}
          >
            <Text style={styles.haveTokenText}>Already have a token? Reset password</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
          <Text style={styles.backBtnText}>← Back to Sign In</Text>
        </TouchableOpacity>
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
  successBanner: {
    backgroundColor: '#064e3b',
    borderColor: '#047857',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  successBannerText: {
    color: '#34d399',
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
  haveTokenBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  haveTokenText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
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
