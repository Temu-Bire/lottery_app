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

export interface VerifyEmailScreenProps {
  email?: string;
  onVerificationComplete: () => void;
  onBackToLogin: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  email,
  onVerificationComplete,
  onBackToLogin,
}) => {
  const { verifyEmail, isLoading, error } = useMobileAuthStore();

  const [token, setToken] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!token.trim()) return;

    const ok = await verifyEmail({ token: token.trim() });
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
          <Text style={styles.brandTitle}>Verify Email</Text>
          <Text style={styles.subtitle}>
            {email ? `Verification token sent to ${email}` : 'Enter your verification token'}
          </Text>
        </View>

        <Card style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Email Verified!</Text>
              <Text style={styles.successDesc}>
                Your email address has been verified successfully. You can now access all lottery games.
              </Text>
              <Button
                title="Continue to Login"
                onPress={onVerificationComplete}
                style={styles.submitBtn}
              />
            </View>
          ) : (
            <>
              <Input
                label="Verification Token"
                placeholder="Paste verification token"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />

              <Button
                title="Verify Account"
                onPress={handleVerify}
                isLoading={isLoading}
                style={styles.submitBtn}
              />
            </>
          )}
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
