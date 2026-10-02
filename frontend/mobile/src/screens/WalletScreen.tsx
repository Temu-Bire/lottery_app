import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formatCurrency,
  formatDateTime,
  WalletOperation,
  DestinationType,
  ApiError,
} from '@lottery/shared';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';

export interface WalletScreenProps {
  onNavigateLogin: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigateLogin }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useMobileAuthStore();

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [destinationType, setDestinationType] = useState<DestinationType>('TELEGRAM_WALLET');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const {
    data: wallet,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['wallet', 'mobile'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
  });

  const currentBalance =
    typeof wallet?.balance === 'string'
      ? parseFloat(wallet.balance)
      : wallet?.balance || 0;

  const {
    data: transactionsData,
    isLoading: isTxLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['wallet', 'mobile-transactions'],
    queryFn: () => api.wallet.getTransactions({ limit: 30 }),
    enabled: isAuthenticated,
  });

  // Deposit Mutation
  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid deposit amount');
      }
      return api.payment.create({
        amount,
        currency: wallet?.currency || 'ETB',
        provider: 'mock',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setDepositModalOpen(false);
      setDepositError(null);
      Alert.alert('Deposit Initiated', 'Funds have been credited to your wallet balance.');
    },
    onError: (err: unknown) => {
      setDepositError(err instanceof ApiError ? err.message : 'Deposit initiation failed');
    },
  });

  // Withdrawal Mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 10) {
        throw new Error('Minimum withdrawal is 10.00 ETB');
      }
      if (!accountNumber.trim()) {
        throw new Error('Account number or wallet handle is required');
      }

      return api.withdrawal.create({
        amount,
        currency: wallet?.currency || 'ETB',
        destinationType,
        destinationDetails: {
          accountNumber: accountNumber.trim(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setWithdrawModalOpen(false);
      setWithdrawError(null);
      setAccountNumber('');
      Alert.alert(
        'Withdrawal Requested',
        'Your withdrawal request is submitted for review and will be processed shortly.',
      );
    },
    onError: (err: unknown) => {
      setWithdrawError(err instanceof ApiError ? err.message : 'Withdrawal request failed');
    },
  });

  const transactions = transactionsData?.data || [];

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.authPromptCard}>
            <Text style={styles.authPromptTitle}>Sign in to view your wallet</Text>
            <Text style={styles.authPromptDesc}>
              Log in to manage your balances, deposit funds, and withdraw winnings.
            </Text>
            <Button title="Sign In" onPress={onNavigateLogin} style={styles.authBtn} />
          </Card>
        </View>
      </View>
    );
  }

  const getOperationColor = (op: WalletOperation) => {
    switch (op) {
      case 'DEPOSIT':
      case 'PRIZE':
      case 'REFUND':
        return '#34d399';
      case 'WITHDRAWAL':
      case 'TICKET_PURCHASE':
        return '#f87171';
      default:
        return '#94a3b8';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet & Funds</Text>
          <Text style={styles.subtitle}>
            Manage your gaming balance, add funds, and request payouts
          </Text>
        </View>

        {/* Balance Card */}
        {isWalletLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
        ) : (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.currencyBadge}>{wallet?.currency || 'ETB'}</Text>
            </View>

            <Text style={styles.balanceAmount}>
              {formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'ETB')}
            </Text>

            {Number(wallet?.lockedBalance || 0) > 0 && (
              <Text style={styles.lockedBalance}>
                ⏳ {formatCurrency(wallet?.lockedBalance, wallet?.currency || 'ETB')} pending withdrawal
              </Text>
            )}

            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.depositBtn}
                onPress={() => setDepositModalOpen(true)}
              >
                <Text style={styles.depositBtnText}>↓ Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => setWithdrawModalOpen(true)}
              >
                <Text style={styles.withdrawBtnText}>↑ Withdraw</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Transaction History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => { refetchWallet(); refetchTx(); }}>
            <Text style={styles.refreshLink}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isTxLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
        ) : transactions.length > 0 ? (
          transactions.map((tx) => {
            const isCredit =
              tx.operation === 'DEPOSIT' ||
              tx.operation === 'PRIZE' ||
              tx.operation === 'REFUND';

            return (
              <Card key={tx.id} style={styles.txCard}>
                <View style={styles.txHeader}>
                  <View>
                    <Text style={styles.txOp}>{tx.operation.replace('_', ' ')}</Text>
                    <Text style={styles.txDate}>{formatDateTime(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: getOperationColor(tx.operation) },
                      ]}
                    >
                      {isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, wallet?.currency || 'ETB')}
                    </Text>
                    <Text style={styles.txBalanceAfter}>
                      Bal: {formatCurrency(tx.balanceAfter, wallet?.currency || 'ETB')}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transaction activity yet.</Text>
          </Card>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={depositModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDepositModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <TouchableOpacity onPress={() => setDepositModalOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Instantly credit your account balance to buy tickets for active draws.
            </Text>

            {depositError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{depositError}</Text>
              </View>
            )}

            <Input
              label="Amount (ETB)"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />

            <View style={styles.presetRow}>
              {['50', '100', '250', '500'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetBtn}
                  onPress={() => setDepositAmount(preset)}
                >
                  <Text style={styles.presetBtnText}>+{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={
                depositMutation.isPending
                  ? 'Processing...'
                  : `Confirm Deposit (${depositAmount || 0} ${wallet?.currency || 'ETB'})`
              }
              isLoading={depositMutation.isPending}
              onPress={() => depositMutation.mutate()}
              style={styles.modalActionBtn}
            />
          </Card>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        visible={withdrawModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setWithdrawModalOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Request a payout from your available balance. Minimum withdrawal is 10.00 ETB.
            </Text>

            {withdrawError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{withdrawError}</Text>
              </View>
            )}

            <Input
              label="Withdrawal Amount (ETB)"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <Text style={styles.fieldLabel}>Destination Method</Text>
            <View style={styles.destToggleRow}>
              <TouchableOpacity
                style={[
                  styles.destToggleBtn,
                  destinationType === 'TELEGRAM_WALLET' && styles.destToggleActive,
                ]}
                onPress={() => setDestinationType('TELEGRAM_WALLET')}
              >
                <Text
                  style={[
                    styles.destToggleText,
                    destinationType === 'TELEGRAM_WALLET' && styles.destToggleTextActive,
                  ]}
                >
                  Telegram Wallet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.destToggleBtn,
                  destinationType === 'BANK_TRANSFER' && styles.destToggleActive,
                ]}
                onPress={() => setDestinationType('BANK_TRANSFER')}
              >
                <Text
                  style={[
                    styles.destToggleText,
                    destinationType === 'BANK_TRANSFER' && styles.destToggleTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label={
                destinationType === 'TELEGRAM_WALLET'
                  ? 'Telegram Username or Wallet Address'
                  : 'Bank Account Number / IBAN'
              }
              placeholder={
                destinationType === 'TELEGRAM_WALLET' ? '@username or UQ...' : 'Account number'
              }
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Button
              title={
                withdrawMutation.isPending
                  ? 'Submitting...'
                  : parseFloat(withdrawAmount) > currentBalance
                  ? 'Insufficient Balance'
                  : 'Submit Withdrawal Request'
              }
              disabled={
                parseFloat(withdrawAmount) > currentBalance || withdrawMutation.isPending
              }
              isLoading={withdrawMutation.isPending}
              onPress={() => withdrawMutation.mutate()}
              style={styles.modalActionBtn}
            />
          </Card>
        </View>
      </Modal>
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
  balanceCard: {
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
    padding: 20,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a5b4fc',
    textTransform: 'uppercase',
  },
  currencyBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  lockedBalance: {
    fontSize: 11,
    color: '#fcd34d',
    marginTop: 2,
    marginBottom: 12,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  depositBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  depositBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  withdrawBtnText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  refreshLink: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
  },
  txCard: {
    padding: 12,
    marginBottom: 8,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txOp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  txDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  txBalanceAfter: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPromptCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  authPromptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  authPromptDesc: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  modalActionBtn: {
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  destToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  destToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  destToggleActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  destToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  destToggleTextActive: {
    color: '#ffffff',
  },
});
