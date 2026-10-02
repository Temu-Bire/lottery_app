import { createApiServices } from '@lottery/shared';

const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';

export const api = createApiServices({
  baseUrl,
  onAuthFailure: () => {
    // If auth fails completely, notify or reset
    console.warn('[Auth] Session invalidated, login required');
  },
});
