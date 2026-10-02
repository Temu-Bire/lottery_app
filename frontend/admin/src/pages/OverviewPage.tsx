import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Dices,
  Ticket,
  Trophy,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@lottery/shared';
import { api } from '../api/client.js';
import { StatCard } from '../components/common/StatCard.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';

export interface OverviewPageProps {
  onNavigate: (route: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.admin.getReports(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-100">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 rounded-xl bg-red-950/30 border border-red-900/50 text-red-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>Failed to load system reports from the backend.</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { users, lotteries, tickets, prizes, finances } = report;

  return (
    <div className="space-y-6">
      {/* Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-100">Platform Overview</h2>
          <p className="text-xs text-slate-400">
            Real-time aggregate platform performance from authoritative backend ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNavigate('lotteries')}
            leftIcon={<Dices className="w-4 h-4" />}
          >
            Manage Lotteries
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('withdrawals')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Review Withdrawals
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value={users.total.toLocaleString()}
          subtitle={`${users.active} active • ${users.suspended} suspended`}
          icon={<Users className="w-5 h-5 text-blue-400" />}
        />

        <StatCard
          title="Tickets Sold"
          value={tickets.totalSold.toLocaleString()}
          subtitle={`Volume: ${formatCurrency(tickets.grossSalesVolume, 'ETB')}`}
          icon={<Ticket className="w-5 h-5 text-indigo-400" />}
        />

        <StatCard
          title="Prizes Awarded"
          value={formatCurrency(prizes.totalPrizesAwarded, 'ETB')}
          subtitle={`${prizes.totalWinners} winning tickets claimed`}
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
        />

        <StatCard
          title="Platform Net Margin"
          value={formatCurrency(finances.netRevenue, 'ETB')}
          subtitle={`Gross Deposits: ${formatCurrency(finances.grossDeposits, 'ETB')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lotteries By Status */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Dices className="w-4 h-4 text-blue-400" />
              Lottery Game Statuses
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Total: {lotteries.total}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(lotteries.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  {status}
                </span>
                <span className="text-base font-extrabold text-slate-100">
                  {count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('lotteries')}
            >
              Open Lottery Manager
            </Button>
          </div>
        </Card>

        {/* Financial Flow Breakdown */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Cash Flow Ledger
            </h3>
            <Badge variant="success">Audited</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Gross Completed Deposits:
              </span>
              <span className="font-extrabold text-emerald-400">
                {formatCurrency(finances.grossDeposits, 'ETB')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
                Gross Completed Withdrawals:
              </span>
              <span className="font-extrabold text-purple-400">
                {formatCurrency(finances.grossWithdrawals, 'ETB')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Net Operating Revenue:
              </span>
              <span className="font-extrabold text-blue-400">
                {formatCurrency(finances.netRevenue, 'ETB')}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
