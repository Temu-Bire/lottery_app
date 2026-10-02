import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lottery, formatCurrency, ApiError } from '@lottery/shared';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';

export interface BuyTicketScreenProps {
  lottery: Lottery;
  onBack: () => void;
  onSuccess: () => void;
  onNavigateWallet: () => void;
}

export const BuyTicketScreen: React.FC<BuyTicketScreenProps> = ({
  lottery,
  onBack,
  onSuccess,
  onNavigateWallet,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useMobileAuthStore();

  const rules = lottery.rules || {
    minNumbers: 6,
    maxNumbers: 6,
    numberRangeMin: 1,
    numberRangeMax: 49,
    bonusNumbersCount: 0,
  };

  const minRange = rules.numberRangeMin || 1;
  const maxRange = rules.numberRangeMax || 49;
  const requiredCount = rules.minNumbers || 6;

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
  });

  const ticketPrice = typeof lottery.ticketPrice === 'string'
    ? parseFloat(lottery.ticketPrice)
    : lottery.ticketPrice;

  const currentBalance = typeof wallet?.balance === 'string'
    ? parseFloat(wallet.balance)
    : (wallet?.balance || 0);

  const hasSufficientBalance = currentBalance >= ticketPrice;
  const isComplete = selectedNumbers.length === requiredCount;

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < requiredCount) {
        setSelectedNumbers((prev) => [...prev, num].sort((a, b) => a - b));
      }
    }
  };

  const handleQuickPick = () => {
    const pool = Array.from({ length: maxRange - minRange + 1 }, (_, i) => minRange + i);
    const picked: number[] = [];
    while (picked.length < requiredCount && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    picked.sort((a, b) => a - b);
    setSelectedNumbers(picked);
  };

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const idempotencyKey = `mob-${lottery.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return api.lottery.purchaseTickets(lottery.id, {
        tickets: [{ selectedNumbers, bonusNumbers: [] }],
        idempotencyKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['lotteries'] });
      setPurchaseSuccess(true);
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : 'Purchase failed';
      Alert.alert('Purchase Error', message);
    },
  });

  const numbersArray = Array.from(
    { length: maxRange - minRange + 1 },
    (_, i) => minRange + i,
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pick Your Numbers</Text>
        <Text style={styles.subtitle}>
          Select {requiredCount} numbers for {lottery.name}
        </Text>

        {/* Selected preview bar */}
        <Card style={styles.previewCard}>
          <View style={styles.previewRow}>
            {selectedNumbers.map((n) => (
              <View key={n} style={styles.selectedBall}>
                <Text style={styles.selectedBallText}>{n}</Text>
              </View>
            ))}
            {Array.from({ length: Math.max(0, requiredCount - selectedNumbers.length) }).map(
              (_, i) => (
                <View key={`empty-${i}`} style={styles.emptyBall}>
                  <Text style={styles.emptyBallText}>?</Text>
                </View>
              ),
            )}
          </View>

          <View style={styles.previewActionRow}>
            <Text style={styles.counterText}>
              {selectedNumbers.length} of {requiredCount} selected
            </Text>
            <TouchableOpacity style={styles.quickPickBtn} onPress={handleQuickPick}>
              <Text style={styles.quickPickText}>✨ Quick Pick</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Numbers Grid */}
        <View style={styles.grid}>
          {numbersArray.map((num) => {
            const isSelected = selectedNumbers.includes(num);
            const isDisabled = !isSelected && isComplete;

            return (
              <TouchableOpacity
                key={num}
                disabled={isDisabled}
                style={[
                  styles.ballBtn,
                  isSelected && styles.ballBtnSelected,
                  isDisabled && styles.ballBtnDisabled,
                ]}
                onPress={() => toggleNumber(num)}
              >
                <Text
                  style={[
                    styles.ballBtnText,
                    isSelected && styles.ballBtnTextSelected,
                    isDisabled && styles.ballBtnTextDisabled,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Balance Warning */}
        {!hasSufficientBalance && isAuthenticated && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>
              Insufficient balance: {formatCurrency(currentBalance, lottery.currency)}
            </Text>
            <TouchableOpacity onPress={onNavigateWallet}>
              <Text style={styles.depositLink}>Deposit funds →</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Total Cost</Text>
          <Text style={styles.bottomPrice}>
            {formatCurrency(ticketPrice, lottery.currency)}
          </Text>
        </View>
        <Button
          title={
            purchaseMutation.isPending
              ? 'Processing...'
              : !isComplete
              ? `Select ${requiredCount - selectedNumbers.length} more`
              : !hasSufficientBalance
              ? 'Deposit to Play'
              : 'Confirm & Buy'
          }
          disabled={!isComplete || !hasSufficientBalance || purchaseMutation.isPending}
          isLoading={purchaseMutation.isPending}
          onPress={() => purchaseMutation.mutate()}
          style={styles.buyBtn}
        />
      </View>

      {/* Success Modal View */}
      {purchaseSuccess && (
        <View style={styles.successOverlay}>
          <Card style={styles.successCard}>
            <Text style={styles.successTitle}>Ticket Purchased!</Text>
            <Text style={styles.successDesc}>
              Your ticket has been recorded on the official draw ledger. Good luck!
            </Text>
            <Button title="View My Tickets" onPress={onSuccess} />
          </Card>
        </View>
      )}
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
    marginBottom: 10,
    marginTop: 4,
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 12,
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
    marginBottom: 14,
  },
  previewCard: {
    padding: 12,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedBall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBallText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBallText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  previewActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  counterText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  quickPickBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  quickPickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fcd34d',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  ballBtn: {
    width: '12.5%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballBtnSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  ballBtnDisabled: {
    opacity: 0.3,
  },
  ballBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  ballBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '900',
  },
  ballBtnTextDisabled: {
    color: '#64748b',
  },
  warningCard: {
    backgroundColor: '#451a03',
    borderColor: '#78350f',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    color: '#fcd34d',
    fontWeight: '600',
  },
  depositLink: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800',
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
    minWidth: 150,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 99,
  },
  successCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
});
