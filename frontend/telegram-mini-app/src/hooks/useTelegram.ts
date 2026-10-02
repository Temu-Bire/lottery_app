import { useEffect, useCallback } from 'react';
import { TelegramWebApp } from '../types/telegram.js';

export function useTelegram() {
  const tg: TelegramWebApp | undefined = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  const haptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error') => {
      if (!tg?.HapticFeedback) return;
      if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    },
    [tg],
  );

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData || '',
    colorScheme: tg?.colorScheme || 'dark',
    themeParams: tg?.themeParams || {},
    haptic,
    isAvailable: !!tg && !!tg.initData,
    close: () => tg?.close(),
  };
}
