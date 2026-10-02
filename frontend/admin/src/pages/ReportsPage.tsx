import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Dices, Trophy, DollarSign } from 'lucide-react';
import { formatCurrency } from '@lottery/shared';
import { api } from '../api/client.js';
import { Card } from '../components/common/Card.js';
import { StatCard } from '../components/common/StatCard.js';

export const ReportsPage: React.FC = () => {
  const { data: report, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.admin.getReports(),
  });

  if (isLoading || !report) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-100">Financial & Operational Reports</h2>
        <div className="h-64 rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
      </div>
    );
  }

  const { users, lotteries, tickets, prizes, finances } = report;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Financial & Operational Reports
        </h2>
        <p className="text-xs text-slate-400">
          Audited platform metrics generated directly from immutable PostgreSQL ledgers
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Gross Ticket Sales"
          value={formatCurrency(tickets.grossSalesVolume, 'ETB')}
          subtitle={`${tickets.totalSold} total tickets sold`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        />

        <StatCard
          title="Total Prizes Committed"
          value={formatCurrency(prizes.totalPrizesAwarded, 'ETB')}
          subtitle={`${prizes.totalWinners} prize payouts`}
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
        />

        <StatCard
          title="Net Operating Margin"
          value={formatCurrency(finances.netRevenue, 'ETB')}
          subtitle="Sales minus total prize distributions"
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            User Base Statistics
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Total Registered Players</span>
              <span className="font-bold text-slate-100">{users.total}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Active Non-Suspended Players</span>
              <span className="font-bold text-emerald-400">{users.active}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Suspended / Review Holds</span>
              <span className="font-bold text-red-400">{users.suspended}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Dices className="w-4 h-4 text-indigo-400" />
            Game Status Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(lotteries.byStatus).map(([st, cnt]) => (
              <div
                key={st}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center"
              >
                <span className="text-slate-400 font-semibold">{st}</span>
                <span className="font-bold text-slate-100">{cnt}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
