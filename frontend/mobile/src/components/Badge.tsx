import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#064e3b', text: '#34d399', border: '#047857' };
      case 'warning':
        return { bg: '#78350f', text: '#fbbf24', border: '#b45309' };
      case 'danger':
        return { bg: '#7f1d1d', text: '#f87171', border: '#b91c1c' };
      case 'info':
        return { bg: '#1e3a8a', text: '#60a5fa', border: '#2563eb' };
      case 'default':
      default:
        return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
