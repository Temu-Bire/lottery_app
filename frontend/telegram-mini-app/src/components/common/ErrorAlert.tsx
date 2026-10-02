import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';

export interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs my-3 ${
        className || ''
      }`}
    >
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-red-300 mb-1">Something went wrong</p>
        <p className="text-red-400/90">{message}</p>
        {onRetry && (
          <div className="mt-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-800 text-red-300 hover:bg-red-900/30 text-xs py-1"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
