import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ticket, TicketStatus, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { useMobileAuthStore } from '../stores/mobile-auth.store.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';

export interface TicketsScreenProps {
  onBrowseLotteries: () => void;
  onNavigateLogin: () => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({
  onBrowseLotteries,
  onNavigateLogin,
}) => {
  const { isAuthenticated } = useMobileAuthStore();
  const [filter, setFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const {
    data: ticketsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tickets', 'mobile-my', filter],
    queryFn: () => api.user.getMyTickets({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const filterTabs: Array<{ id: 'ALL' | TicketStatus; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'ACTIVE', label: 'In Play' },
    { id: 'WON', label: 'Winning' },
    { id: 'LOST', label: 'Past' },
  ];

  const allTickets = ticketsData?.data || [];
  const filteredTickets =
    filter === 'ALL' ? allTickets : allTickets.filter((t) => t.status === filter);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.authPromptCard}>
            <Text style={styles.authPromptTitle}>Sign in to view your tickets</Text>
            <Text style={styles.authPromptDesc}>
              Log in to track your lottery tickets, draw results, and verify winnings.
            </Text>
            <Button title="Sign In" onPress={onNavigateLogin} style={styles.authBtn} />
          </Card>
        </View>
      </View>
    );
  }

  const getStatusVariant = (status: TicketStatus) => {
    switch (status) {
      case 'WON':
        return 'success';
      case 'ACTIVE':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>Track your tickets and verified draw results</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setFilter(tab.id)}
            style={[styles.tab, filter === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedTicket(item)}
            >
              <Card style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketLottery}>
                      {item.lottery?.name || 'Jackpot Lottery'}
                    </Text>
                    <Text style={styles.ticketNumber}>#{item.ticketNumber}</Text>
                  </View>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} />
                </View>

                {/* Selected Numbers Preview */}
                <View style={styles.ballsRow}>
                  {item.selectedNumbers.map((num) => (
                    <View key={num} style={styles.ball}>
                      <Text style={styles.ballText}>{num}</Text>
                    </View>
                  ))}
                  {item.bonusNumbers?.map((b) => (
                    <View key={`b-${b}`} style={styles.bonusBall}>
                      <Text style={styles.bonusBallText}>{b}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketDate}>
                    Purchased: {formatDateTime(item.createdAt)}
                  </Text>
                  <Text style={styles.detailsLink}>View Details →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyText}>
                {filter === 'ALL'
                  ? 'Pick your lucky numbers in any active jackpot to participate!'
                  : `You have no ${filter.toLowerCase()} tickets.`}
              </Text>
              <Button
                title="Browse Lotteries"
                onPress={onBrowseLotteries}
                size="sm"
                style={styles.browseBtn}
              />
            </Card>
          }
        />
      )}

      {/* Ticket Details Modal */}
      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lottery:</Text>
                  <Text style={styles.infoValue}>
                    {selectedTicket.lottery?.name || 'Lottery Draw'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ticket Number:</Text>
                  <Text style={styles.infoValueBold}>#{selectedTicket.ticketNumber}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Badge
                    label={selectedTicket.status}
                    variant={getStatusVariant(selectedTicket.status)}
                  />
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reference:</Text>
                  <Text style={styles.infoCode}>
                    {selectedTicket.purchaseReference}
                  </Text>
                </View>

                <View style={styles.numbersSection}>
                  <Text style={styles.numbersLabel}>Selected Numbers:</Text>
                  <View style={styles.ballsRow}>
                    {selectedTicket.selectedNumbers.map((n) => (
                      <View key={n} style={styles.modalBall}>
                        <Text style={styles.ballText}>{n}</Text>
                      </View>
                    ))}
                    {selectedTicket.bonusNumbers?.map((b) => (
                      <View key={`modal-b-${b}`} style={styles.modalBonusBall}>
                        <Text style={styles.bonusBallText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Button
                  title="Close"
                  onPress={() => setSelectedTicket(null)}
                  style={styles.modalCloseBtn}
                />
              </View>
            )}
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
  ticketCard: {
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketLottery: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  ticketNumber: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 2,
  },
  ballsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  ball: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  bonusBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusBallText: {
    color: '#020617',
    fontSize: 11,
    fontWeight: '800',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 4,
  },
  ticketDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  detailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
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
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 14,
  },
  browseBtn: {
    minWidth: 140,
  },
  loader: {
    marginVertical: 40,
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
    marginBottom: 16,
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
  modalBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
  },
  infoValueBold: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  infoCode: {
    fontSize: 10,
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  numbersSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  numbersLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modalBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBonusBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    marginTop: 10,
  },
});
