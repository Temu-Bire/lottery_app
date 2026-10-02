import React from 'react';
import { clsx } from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-sm p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
