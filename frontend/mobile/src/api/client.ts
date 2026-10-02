import { createApiServices } from '@lottery/shared';
import { MobileSecureTokenStorage } from './secure-storage.js';

// Base URL: can be overridden by EXPO_PUBLIC_API_URL or defaults to localhost/Android emulator bridge
const baseUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3000/api/v1';

export const mobileStorage = new MobileSecureTokenStorage();

export const api = createApiServices({
  baseUrl,
  storage: mobileStorage,
  onAuthFailure: () => {
    console.warn('[Mobile Auth] Session expired. Redirecting to login.');
  },
});
