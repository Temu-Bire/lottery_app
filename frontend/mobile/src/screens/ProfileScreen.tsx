import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export interface ProfileScreenProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useMobileAuthStore();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'mobile'],
    queryFn: () => api.notification.list({ limit: 10 }),
    enabled: isAuthenticated,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notification.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Card style={styles.authCard}>
            <Text style={styles.authTitle}>Player Account</Text>
            <Text style={styles.authDesc}>
              Sign in or create an account to view your profile, manage security, and check notifications.
            </Text>
            <Button
              title="Sign In"
              onPress={onNavigateLogin}
              style={styles.authBtn}
            />
            <View style={styles.space8} />
            <Button
              title="Create Account"
              variant="outline"
              onPress={onNavigateRegister}
              style={styles.authBtn}
            />
          </Card>
        </View>
      </View>
    );
  }

  const initial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Lottery Player';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Account & Security</Text>
          <Text style={styles.subtitle}>Manage player details, security, and notices</Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <Badge
              label={user?.status || 'ACTIVE'}
              variant={user?.status === 'ACTIVE' ? 'success' : 'default'}
            />
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Role</Text>
              <Text style={styles.metaVal}>{user?.roles?.[0] || 'USER'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Verification</Text>
              <Text style={styles.metaValVerified}>✓ Verified</Text>
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ''}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
              <Text style={styles.markReadLink}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <Card
              key={n.id}
              style={[styles.notifCard, !n.isRead && styles.notifUnread]}
            >
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifMessage}>{n.message}</Text>
              <Text style={styles.notifDate}>
                {new Date(n.createdAt).toLocaleDateString()} •{' '}
                {new Date(n.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No notifications at this time.</Text>
          </Card>
        )}

        {/* Provable Fairness Card */}
        <Text style={styles.sectionTitle}>Fairness & Integrity</Text>
        <Card style={styles.fairnessCard}>
          <Text style={styles.fairnessTitle}>🛡️ Provably Fair Engine</Text>
          <Text style={styles.fairnessDesc}>
            All winning draw selections utilize HMAC-SHA256 cryptographic seed commitments
            and audited server randomness. Public draw proofs can be independently verified
            at any time.
          </Text>
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  userCard: {
    padding: 16,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  userEmail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  metaItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  metaValVerified: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10,
  },
  markReadLink: {
    fontSize: 11,
    color: '#60a5fa',
    fontWeight: '600',
  },
  notifCard: {
    padding: 12,
    marginBottom: 8,
  },
  notifUnread: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 6,
  },
  notifDate: {
    fontSize: 10,
    color: '#64748b',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fairnessCard: {
    padding: 14,
    marginBottom: 24,
    backgroundColor: '#0f172a',
  },
  fairnessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 4,
  },
  fairnessDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  signOutBtn: {
    borderColor: '#7f1d1d',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  authDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  authBtn: {
    width: '100%',
  },
  space8: {
    height: 8,
  },
});
