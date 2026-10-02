import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Lottery, formatCurrency, calculateTimeRemaining } from '@lottery/shared';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export interface HomeScreenProps {
  onNavigateLotteries: () => void;
  onSelectLottery: (lottery: Lottery) => void;
  onNavigateWallet: () => void;
  onNavigateLogin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateLotteries,
  onSelectLottery,
  onNavigateWallet,
  onNavigateLogin,
}) => {
  const { isAuthenticated } = useMobileAuthStore();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
  });

  const { data: lotteriesResult, isLoading } = useQuery({
    queryKey: ['lotteries', 'mobile-home'],
    queryFn: () => api.lottery.list({ limit: 5, status: 'OPEN' }),
  });

  const { data: winnersResult } = useQuery({
    queryKey: ['winners', 'mobile-home'],
    queryFn: () => api.winner.list({ limit: 3 }),
  });

  const lotteries = lotteriesResult?.data || [];
  const winners = winnersResult?.data || [];
  const featured = lotteries[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner / User Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>
            LOTTO<Text style={styles.brandHighlight}>WIN</Text>
          </Text>
          <Text style={styles.tagline}>Provably Fair Jackpot Draws</Text>
        </View>

        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.balancePill}
            onPress={onNavigateWallet}
            activeOpacity={0.8}
          >
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'ETB')}
            </Text>
          </TouchableOpacity>
        ) : (
          <Button
            title="Sign In"
            size="sm"
            onPress={onNavigateLogin}
          />
        )}
      </View>

      {/* Featured Jackpot Banner */}
      {featured ? (
        <Card style={styles.featuredCard}>
          <View style={styles.featuredBadgeRow}>
            <Badge label="Active Jackpot" variant="success" />
            <Text style={styles.timerText}>
              Draw: {calculateTimeRemaining(featured.drawDate).formatted}
            </Text>
          </View>

          <Text style={styles.featuredTitle}>{featured.name}</Text>

          <View style={styles.jackpotRow}>
            <Text style={styles.jackpotLabel}>Estimated Top Prize</Text>
            <Text style={styles.jackpotValue}>
              {formatCurrency(
                featured.prizes?.[0]?.amount || '1000000',
                featured.currency,
              )}
            </Text>
          </View>

          <Button
            title={`Play Now (${formatCurrency(featured.ticketPrice, featured.currency)})`}
            onPress={() => onSelectLottery(featured)}
            style={styles.playNowBtn}
          />
        </Card>
      ) : null}

      {/* Quick Action Navigation */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Games</Text>
        <TouchableOpacity onPress={onNavigateLotteries}>
          <Text style={styles.seeAllText}>Browse All →</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
      ) : lotteries.length > 0 ? (
        lotteries.map((l) => (
          <TouchableOpacity
            key={l.id}
            activeOpacity={0.8}
            onPress={() => onSelectLottery(l)}
          >
            <Card style={styles.lotteryCard}>
              <View style={styles.lotteryCardHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.lotteryName}>{l.name}</Text>
                  <Text style={styles.lotteryDate}>
                    Draw in {calculateTimeRemaining(l.drawDate).formatted}
                  </Text>
                </View>
                <Badge label={l.status} variant="info" />
              </View>

              <View style={styles.lotteryFooter}>
                <Text style={styles.ticketPrice}>
                  Ticket: {formatCurrency(l.ticketPrice, l.currency)}
                </Text>
                <Text style={styles.viewAction}>Select Numbers →</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active lotteries at the moment.</Text>
        </Card>
      )}

      {/* Recent Winners */}
      {winners.length > 0 && (
        <View style={styles.winnersSection}>
          <Text style={styles.sectionTitle}>Recent Winners</Text>
          <Card style={styles.winnersCard}>
            {winners.map((w, idx) => (
              <View
                key={w.id}
                style={[styles.winnerRow, idx > 0 && styles.winnerRowBorder]}
              >
                <View>
                  <Text style={styles.winnerTier}>
                    {w.prize?.name || `Tier ${w.prizeId}`}
                  </Text>
                  <Text style={styles.winnerMatch}>Match {w.matchCount} numbers</Text>
                </View>
                <Text style={styles.winnerAmount}>
                  +{formatCurrency(w.prizeAmount, 'ETB')}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandHighlight: {
    color: '#3b82f6',
  },
  tagline: {
    fontSize: 11,
    color: '#94a3b8',
  },
  balancePill: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  featuredCard: {
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
    padding: 20,
    marginBottom: 20,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 11,
    color: '#a5b4fc',
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  jackpotRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  jackpotLabel: {
    fontSize: 10,
    color: '#fcd34d',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  jackpotValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
  },
  playNowBtn: {
    backgroundColor: '#2563eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  seeAllText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
  },
  lotteryCard: {
    padding: 14,
    marginBottom: 10,
  },
  lotteryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  flexOne: {
    flex: 1,
  },
  lotteryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  lotteryDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  lotteryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  ticketPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  viewAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  winnersSection: {
    marginTop: 16,
  },
  winnersCard: {
    padding: 12,
  },
  winnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  winnerRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  winnerTier: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  winnerMatch: {
    fontSize: 10,
    color: '#94a3b8',
  },
  winnerAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  loader: {
    marginVertical: 20,
  },
});
