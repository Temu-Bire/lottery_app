import React from 'react';
import { Card } from './Card.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
}) => {
  return (
    <Card className="p-4 flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="text-2xl font-extrabold text-slate-100 tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>

      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400 shrink-0">
        {icon}
      </div>
    </Card>
  );
};
