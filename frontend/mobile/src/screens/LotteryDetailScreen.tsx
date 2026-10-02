import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Lottery, formatCurrency, formatDateTime, calculateTimeRemaining } from '@lottery/shared';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export interface LotteryDetailScreenProps {
  lottery: Lottery;
  onBack: () => void;
  onBuyTicket: (lottery: Lottery) => void;
}

export const LotteryDetailScreen: React.FC<LotteryDetailScreenProps> = ({
  lottery,
  onBack,
  onBuyTicket,
}) => {
  const timeLeft = calculateTimeRemaining(lottery.drawDate);
  const isOpen = lottery.status === 'OPEN' && !timeLeft.isExpired;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Lotteries</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{lottery.name}</Text>
          <Badge label={lottery.status} variant={isOpen ? 'success' : 'default'} />
        </View>

        <Text style={styles.description}>
          {lottery.description || 'Pick your numbers for a chance to win verified cash jackpots.'}
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Ticket Price</Text>
            <Text style={styles.statValue}>
              {formatCurrency(lottery.ticketPrice, lottery.currency)}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Tickets Sold</Text>
            <Text style={styles.statValue}>
              {lottery.totalTicketsSold.toLocaleString()}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Sales Closes</Text>
            <Text style={styles.statSubValue}>
              {formatDateTime(lottery.salesEnd)}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Official Draw</Text>
            <Text style={styles.statSubValue}>
              {formatDateTime(lottery.drawDate)}
            </Text>
          </Card>
        </View>

        {/* Prize Tiers */}
        <Text style={styles.sectionTitle}>Prize Breakdown</Text>
        <Card style={styles.prizeCard}>
          {lottery.prizes && lottery.prizes.length > 0 ? (
            lottery.prizes.map((p, idx) => (
              <View
                key={p.tier}
                style={[styles.prizeRow, idx > 0 && styles.prizeRowBorder]}
              >
                <View>
                  <Text style={styles.prizeName}>{p.name}</Text>
                  <Text style={styles.prizeMatch}>
                    Match {p.matchCount} numbers{p.matchBonus ? ' + Bonus' : ''}
                  </Text>
                </View>
                <Text style={styles.prizeAmount}>
                  {formatCurrency(p.amount, lottery.currency)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyPrize}>Prize structure will be announced prior to draw.</Text>
          )}
        </Card>

        {/* Rules */}
        {lottery.rules && (
          <>
            <Text style={styles.sectionTitle}>Game Rules</Text>
            <Card style={styles.rulesCard}>
              <Text style={styles.ruleItem}>
                • Choose {lottery.rules.minNumbers} numbers between {lottery.rules.numberRangeMin} and {lottery.rules.numberRangeMax}.
              </Text>
              {lottery.rules.bonusNumbersCount > 0 && (
                <Text style={styles.ruleItem}>
                  • Includes {lottery.rules.bonusNumbersCount} bonus ball from {lottery.rules.bonusRangeMin || 1}-{lottery.rules.bonusRangeMax || 10}.
                </Text>
              )}
              <Text style={styles.ruleItem}>
                • Cryptographically verified draw proofs published to ledger.
              </Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Per ticket</Text>
          <Text style={styles.bottomPrice}>
            {formatCurrency(lottery.ticketPrice, lottery.currency)}
          </Text>
        </View>
        <Button
          title={isOpen ? 'Pick Numbers' : 'Sales Closed'}
          disabled={!isOpen}
          onPress={() => onBuyTicket(lottery)}
          style={styles.buyBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  backBtn: {
    marginBottom: 12,
    marginTop: 4,
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 12,
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  statSubValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    marginTop: 8,
  },
  prizeCard: {
    padding: 12,
    marginBottom: 16,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prizeRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  prizeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  prizeMatch: {
    fontSize: 10,
    color: '#94a3b8',
  },
  prizeAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  emptyPrize: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  rulesCard: {
    padding: 14,
    gap: 6,
  },
  ruleItem: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  bottomPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  buyBtn: {
    minWidth: 140,
  },
});
