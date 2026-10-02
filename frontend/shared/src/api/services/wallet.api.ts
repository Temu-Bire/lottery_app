import { ApiClient } from '../client.js';
import {
  Wallet,
  WalletTransaction,
  ClaimPrizeResponse,
  WalletConsistencyResponse,
} from '../../types/wallet.js';
import { PaginationQuery, PaginatedResult } from '../../types/api.js';

export const createWalletApi = (client: ApiClient) => ({
  getWallet: (): Promise<Wallet> =>
    client.get<Wallet>('/wallet'),

  getTransactions: (query?: PaginationQuery): Promise<PaginatedResult<WalletTransaction>> =>
    client.getPaginated<WalletTransaction>('/wallet/transactions', query as Record<string, unknown>),

  claimPrize: (winnerId: string): Promise<ClaimPrizeResponse> =>
    client.post<ClaimPrizeResponse>(`/wallet/claim-prize/${winnerId}`),

  verifyConsistency: (): Promise<WalletConsistencyResponse> =>
    client.get<WalletConsistencyResponse>('/wallet/consistency'),
});

export type WalletApi = ReturnType<typeof createWalletApi>;
