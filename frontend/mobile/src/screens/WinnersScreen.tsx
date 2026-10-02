import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, maskEmail, Winner } from '@lottery/shared';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export interface WinnersScreenProps {
  onNavigateLogin: () => void;
}

export const WinnersScreen: React.FC<WinnersScreenProps> = ({ onNavigateLogin }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useMobileAuthStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE'>('ALL');

  // Query All Public Winners
  const {
    data: allWinnersData,
    isLoading: isAllLoading,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['winners', 'mobile-public'],
    queryFn: () => api.winner.list({ limit: 50 }),
  });

  // Query User's Personal Wins
  const {
    data: myWinnersData,
    isLoading: isMineLoading,
    refetch: refetchMine,
  } = useQuery({
    queryKey: ['winners', 'mobile-mine'],
    queryFn: () => api.user.getMyWinners({ limit: 50 }),
    enabled: isAuthenticated,
  });

  // Claim Prize Mutation
  const claimMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      return api.wallet.claimPrize(winnerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['winners'] });
      Alert.alert('Prize Claimed!', 'The prize amount has been credited to your wallet balance.');
    },
    onError: () => {
      Alert.alert('Claim Failed', 'Could not process prize claim at this time.');
    },
  });

  const publicWinners = allWinnersData?.data || [];
  const myWinners = myWinnersData?.data || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hall of Winners</Text>
        <Text style={styles.subtitle}>
          Verified public payout ledger and your personal prize claims
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All Winners
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'MINE' && styles.tabActive]}
          onPress={() => setActiveTab('MINE')}
        >
          <Text style={[styles.tabText, activeTab === 'MINE' && styles.tabTextActive]}>
            My Wins {isAuthenticated && `(${myWinners.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ALL' ? (
        isAllLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
        ) : (
          <FlatList
            data={publicWinners}
            keyExtractor={(item) => item.id}
            refreshing={isAllLoading}
            onRefresh={refetchAll}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.winnerCard}>
                <View style={styles.winnerHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.prizeName}>
                      {item.prize?.name || `Tier ${item.matchCount} Match`}
                    </Text>
                    <Text style={styles.winnerSub}>
                      {item.user?.email ? maskEmail(item.user.email) : 'Player'} • Match {item.matchCount}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.prizeAmount}>
                      +{formatCurrency(item.prizeAmount, 'ETB')}
                    </Text>
                    <Badge
                      label={item.payoutStatus}
                      variant={item.payoutStatus === 'PAID' ? 'success' : 'warning'}
                    />
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No winners recorded yet</Text>
                <Text style={styles.emptyText}>
                  Winning tickets from official draws will be published here.
                </Text>
              </Card>
            }
          />
        )
      ) : !isAuthenticated ? (
        <View style={styles.authContainer}>
          <Card style={styles.authCard}>
            <Text style={styles.authTitle}>Sign in to view your prizes</Text>
            <Text style={styles.authDesc}>
              Log in to see if your tickets have won any prizes and claim your cash rewards.
            </Text>
            <Button title="Sign In" onPress={onNavigateLogin} style={styles.authBtn} />
          </Card>
        </View>
      ) : isMineLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={myWinners}
          keyExtractor={(item) => item.id}
          refreshing={isMineLoading}
          onRefresh={refetchMine}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Winner }) => {
            const isUnpaid = item.payoutStatus === 'UNPAID';

            return (
              <Card style={styles.myWinCard}>
                <View style={styles.myWinHeader}>
                  <View>
                    <Text style={styles.myWinBadge}>PRIZE WON</Text>
                    <Text style={styles.myWinTitle}>
                      {item.prize?.name || 'Lottery Win'}
                    </Text>
                  </View>
                  <Badge
                    label={item.payoutStatus}
                    variant={isUnpaid ? 'warning' : 'success'}
                  />
                </View>

                <View style={styles.myWinAmountRow}>
                  <Text style={styles.myWinLabel}>Prize Amount:</Text>
                  <Text style={styles.myWinAmount}>
                    {formatCurrency(item.prizeAmount, 'ETB')}
                  </Text>
                </View>

                {isUnpaid && (
                  <Button
                    title="Claim to Wallet"
                    size="sm"
                    isLoading={claimMutation.isPending}
                    onPress={() => claimMutation.mutate(item.id)}
                    style={styles.claimBtn}
                  />
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No prize winnings yet</Text>
              <Text style={styles.emptyText}>
                Keep playing! Check upcoming draws for new jackpot opportunities.
              </Text>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 30,
  },
  winnerCard: {
    padding: 14,
    marginBottom: 8,
  },
  winnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexOne: {
    flex: 1,
  },
  prizeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  winnerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  prizeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fbbf24',
  },
  myWinCard: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
  },
  myWinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  myWinBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fcd34d',
    textTransform: 'uppercase',
  },
  myWinTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  myWinAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  myWinLabel: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  myWinAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
  },
  claimBtn: {
    marginTop: 8,
    backgroundColor: '#059669',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  authDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  authBtn: {
    width: '100%',
  },
  loader: {
    marginVertical: 30,
  },
});
