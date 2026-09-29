import { describe, it, expect } from 'vitest';
import { generateSecureWinningNumbers } from '../../src/utils/cryptoRandom.js';

describe('Cryptographically Secure Draw Randomness Engine', () => {
  it('should generate exact required count of unique numbers within bounds', () => {
    const min = 1;
    const max = 49;
    const count = 6;

    const result = generateSecureWinningNumbers(min, max, count);

    expect(result.numbers).toHaveLength(count);
    // Check all numbers are in bounds
    for (const num of result.numbers) {
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    }
    // Check all numbers are unique
    const unique = new Set(result.numbers);
    expect(unique.size).toBe(count);
    // Check sorted ascending
    const sorted = [...result.numbers].sort((a, b) => a - b);
    expect(result.numbers).toEqual(sorted);
  });

  it('should generate verifiable cryptographic commitment proof and seed hash', () => {
    const result = generateSecureWinningNumbers(1, 20, 5, 1, 1, 10);

    expect(result.seed).toBeDefined();
    expect(result.seedHash).toBeDefined();
    expect(result.seed.length).toBe(64); // 32 bytes hex
    expect(result.seedHash.length).toBe(64); // sha256 hex
    expect(result.bonusNumbers).toHaveLength(1);

    const proof = JSON.parse(result.randomnessProof);
    expect(proof.algorithm).toBe('HMAC_SHA256_CSPRNG_FISHER_YATES');
    expect(proof.seedHash).toBe(result.seedHash);
  });
});
