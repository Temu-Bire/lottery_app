import { createApiServices, LocalStorageTokenStorage } from '@lottery/shared';

const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';

export const adminStorage = new LocalStorageTokenStorage('lottery_admin_');

export const api = createApiServices({
  baseUrl,
  storage: adminStorage,
  onAuthFailure: () => {
    console.warn('[Admin Auth] Session expired. Redirecting to login.');
  },
});
