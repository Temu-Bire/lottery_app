import { describe, it, expect } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

describe('Financial Consistency & Ledger Calculations', () => {
  it('should accurately calculate net balance across diverse ledger operations', () => {
    const transactions = [
      { operation: 'DEPOSIT', amount: new Decimal('100.00') },
      { operation: 'TICKET_PURCHASE', amount: new Decimal('15.00') },
      { operation: 'TICKET_PURCHASE', amount: new Decimal('10.00') },
      { operation: 'PRIZE', amount: new Decimal('50.00') },
      { operation: 'WITHDRAWAL', amount: new Decimal('25.00') },
      { operation: 'REFUND', amount: new Decimal('5.00') },
    ];

    let calculated = new Decimal(0);
    for (const tx of transactions) {
      if (tx.operation === 'DEPOSIT' || tx.operation === 'PRIZE' || tx.operation === 'REFUND') {
        calculated = calculated.plus(tx.amount);
      } else if (tx.operation === 'WITHDRAWAL' || tx.operation === 'TICKET_PURCHASE') {
        calculated = calculated.minus(tx.amount);
      }
    }

    // Expected: 100 - 15 - 10 + 50 - 25 + 5 = 105.00
    expect(calculated.toString()).toBe('105');
  });

  it('should detect balance discrepancy when ledger transactions do not match balance', () => {
    const recordedBalance = new Decimal('120.00');
    const computedFromLedger = new Decimal('105.00');

    const discrepancy = recordedBalance.minus(computedFromLedger);
    const isConsistent = discrepancy.equals(0);

    expect(isConsistent).toBe(false);
    expect(discrepancy.toString()).toBe('15');
  });
});
