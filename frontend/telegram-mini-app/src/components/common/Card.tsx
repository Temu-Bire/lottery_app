import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'interactive' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-900/90 border border-slate-800 shadow-sm',
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-900/30 shadow-lg shadow-blue-950/20',
    interactive: 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm',
    flat: 'bg-slate-900/50 border border-slate-800/60',
  };

  return (
    <div
      className={clsx('rounded-2xl p-4', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
