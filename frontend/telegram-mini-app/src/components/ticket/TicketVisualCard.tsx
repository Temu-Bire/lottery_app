import React from 'react';
import { Ticket, formatCurrency, formatDateTime, TICKET_STATUS_CONFIG } from '@lottery/shared';
import { Badge } from '../common/Badge.js';
import { Trophy } from 'lucide-react';

export interface TicketVisualCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export const TicketVisualCard: React.FC<TicketVisualCardProps> = ({
  ticket,
  onClick,
}) => {
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    color: '#94a3b8',
    bg: '#1e293b',
  };

  const isWinner = ticket.status === 'WON';

  return (
    <div
      onClick={() => onClick?.(ticket)}
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isWinner
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-600/50 shadow-lg shadow-amber-900/20'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      } p-4 cursor-pointer active:scale-[0.99]`}
    >
      {/* Decorative Ticket Perforation Notch */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-slate-800" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-slate-800" />

      {/* Header Info */}
      <div className="flex items-start justify-between mb-3 pl-2 pr-2">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
            Ticket #{ticket.ticketNumber}
          </span>
          <h4 className="text-sm font-bold text-slate-100">
            {ticket.lottery?.name || 'Lottery Draw'}
          </h4>
        </div>
        <Badge
          variant={
            isWinner
              ? 'success'
              : ticket.status === 'ACTIVE'
              ? 'info'
              : 'default'
          }
        >
          {isWinner ? (
            <span className="flex items-center gap-1 font-bold">
              <Trophy className="w-3 h-3 text-amber-400" /> Winner
            </span>
          ) : (
            statusConfig.label
          )}
        </Badge>
      </div>

      {/* Selected Numbers Display */}
      <div className="my-3 py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {ticket.selectedNumbers?.map((num, idx) => (
            <span
              key={`num-${idx}`}
              className="w-7 h-7 rounded-full bg-blue-600/90 text-white font-bold text-xs flex items-center justify-center shadow-sm"
            >
              {num}
            </span>
          ))}
          {ticket.bonusNumbers && ticket.bonusNumbers.length > 0 && (
            <>
              <span className="text-xs text-slate-500 font-bold">+</span>
              {ticket.bonusNumbers.map((num, idx) => (
                <span
                  key={`bonus-${idx}`}
                  className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm"
                >
                  {num}
                </span>
              ))}
            </>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-300">
          {formatCurrency(ticket.price, ticket.lottery?.currency || 'ETB')}
        </span>
      </div>

      {/* Footer Info & Aesthetic Barcode */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 pl-2 pr-2 border-t border-dashed border-slate-800/80">
        <span>Purchased: {formatDateTime(ticket.createdAt)}</span>
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[9px]">
          || | | ||| || |||
        </div>
      </div>
    </div>
  );
};
