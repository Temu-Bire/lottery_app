import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Lottery, LotteryStatus, formatCurrency, calculateTimeRemaining } from '@lottery/shared';
import { api } from '../api/client.js';
import { Card } from '../components/Card.js';
import { Badge } from '../components/Badge.js';

export interface LotteriesScreenProps {
  onSelectLottery: (lottery: Lottery) => void;
}

export const LotteriesScreen: React.FC<LotteriesScreenProps> = ({ onSelectLottery }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LotteryStatus | 'ALL'>('ALL');

  const { data: lotteriesResult, isLoading, refetch } = useQuery({
    queryKey: ['lotteries', 'mobile-list', search, status],
    queryFn: () =>
      api.lottery.list({
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        limit: 30,
      }),
  });

  const lotteries = lotteriesResult?.data || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Lotteries</Text>
        <Text style={styles.subtitle}>Select a game to view prize rules or pick numbers</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search lottery..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.tabRow}>
        {(['ALL', 'OPEN', 'SCHEDULED', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setStatus(tab)}
            style={[styles.tab, status === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, status === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={lotteries}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectLottery(item)}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={1}>
                      {item.description || 'Weekly cash jackpot draw'}
                    </Text>
                  </View>
                  <Badge label={item.status} variant={item.status === 'OPEN' ? 'success' : 'default'} />
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.ticketPrice, item.currency)}
                  </Text>
                  <Text style={styles.itemCountdown}>
                    {calculateTimeRemaining(item.drawDate).formatted}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No lotteries found</Text>
            </Card>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
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
  searchInput: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 30,
  },
  itemCard: {
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  flexOne: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  itemDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  itemCountdown: {
    fontSize: 11,
    color: '#60a5fa',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  loader: {
    marginVertical: 40,
  },
});
