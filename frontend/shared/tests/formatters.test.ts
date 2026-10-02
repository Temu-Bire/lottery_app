import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateTimeRemaining,
  maskEmail,
  maskWalletAddress,
} from '../src/utils/formatters.js';

describe('Formatters', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(1500, 'ETB')).toBe('1,500.00 ETB');
    expect(formatCurrency(25.5, 'USD')).toBe('25.50 USD');
    expect(formatCurrency('100.99', 'EUR')).toBe('100.99 EUR');
    expect(formatCurrency(null)).toBe('0.00 ETB');
  });

  it('formats date and time', () => {
    const testDate = new Date('2026-10-15T14:30:00Z');
    expect(formatDate(testDate)).toBeTruthy();
    expect(formatDateTime(testDate)).toBeTruthy();
  });

  it('calculates time remaining countdown', () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000);
    const result = calculateTimeRemaining(futureDate);
    expect(result.isExpired).toBe(false);
    expect(result.days).toBeGreaterThanOrEqual(2);
    expect(result.formatted).toContain('d');

    const pastDate = new Date(Date.now() - 10000);
    const expired = calculateTimeRemaining(pastDate);
    expect(expired.isExpired).toBe(true);
    expect(expired.formatted).toBe('Draw closed');
  });

  it('masks sensitive email and wallet address', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j******e@example.com');
    expect(maskWalletAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x12...5678');
  });
});
