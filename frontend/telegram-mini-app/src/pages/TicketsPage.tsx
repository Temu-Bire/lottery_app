import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket as TicketIcon } from 'lucide-react';
import { Ticket, TicketStatus } from '@lottery/shared';
import { api } from '../api/client.js';
import { TicketVisualCard } from '../components/ticket/TicketVisualCard.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { useAuthStore } from '../stores/auth.store.js';

export interface TicketsPageProps {
  onBrowseLotteries: () => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ onBrowseLotteries }) => {
  const { isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tickets', 'my', filter],
    queryFn: () =>
      api.user.getMyTickets({
        limit: 50,
      }),
    enabled: isAuthenticated,
  });

  const filterTabs: Array<{ id: 'ALL' | TicketStatus; label: string }> = [
    { id: 'ALL', label: 'All Tickets' },
    { id: 'ACTIVE', label: 'In Play' },
    { id: 'WON', label: 'Winning' },
    { id: 'LOST', label: 'Past Draws' },
  ];

  const allTickets = ticketsData?.data || [];
  const filteredTickets = filter === 'ALL'
    ? allTickets
    : allTickets.filter((t) => t.status === filter);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<TicketIcon className="w-10 h-10" />}
        title="Sign in to view your tickets"
        description="Authenticate via Telegram to track your active lottery tickets and winnings."
        actionText="Browse Lotteries"
        onAction={onBrowseLotteries}
      />
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">My Tickets</h2>
        <p className="text-xs text-slate-400">
          Track all your purchased tickets and check winning statuses
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorAlert message="Failed to load tickets" onRetry={() => refetch()} />
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketVisualCard
              key={ticket.id}
              ticket={ticket}
              onClick={(t) => setSelectedTicket(t)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TicketIcon className="w-10 h-10" />}
          title="You don't have any tickets yet"
          description="Pick your lucky numbers in any of our active jackpots and join the next draw!"
          actionText="Browse Lotteries"
          onAction={onBrowseLotteries}
        />
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Details"
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Ticket Number:</span>
                <span className="font-mono font-bold text-slate-200">
                  #{selectedTicket.ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase Reference:</span>
                <span className="font-mono text-slate-400">
                  {selectedTicket.purchaseReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-blue-400">{selectedTicket.status}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-300 block mb-2">
                Selected Numbers:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedTicket.selectedNumbers.map((n) => (
                  <span
                    key={n}
                    className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center"
                  >
                    {n}
                  </span>
                ))}
                {selectedTicket.bonusNumbers?.map((n) => (
                  <span
                    key={`b-${n}`}
                    className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
