import { ApiClient, ApiClientConfig } from './client.js';
import { createAuthApi, AuthApi } from './services/auth.api.js';
import { createUserApi, UserApi } from './services/user.api.js';
import { createLotteryApi, LotteryApi } from './services/lottery.api.js';
import { createTicketApi, TicketApi } from './services/ticket.api.js';
import { createDrawApi, DrawApi } from './services/draw.api.js';
import { createWinnerApi, WinnerApi } from './services/winner.api.js';
import { createWalletApi, WalletApi } from './services/wallet.api.js';
import { createPaymentApi, PaymentApi } from './services/payment.api.js';
import { createWithdrawalApi, WithdrawalApi } from './services/withdrawal.api.js';
import { createNotificationApi, NotificationApi } from './services/notification.api.js';
import { createAdminApi, AdminApi } from './services/admin.api.js';

export * from './client.js';
export * from './errors.js';
export * from './storage.js';
export * from './services/index.js';

export interface ApiServices {
  client: ApiClient;
  auth: AuthApi;
  user: UserApi;
  lottery: LotteryApi;
  ticket: TicketApi;
  draw: DrawApi;
  winner: WinnerApi;
  wallet: WalletApi;
  payment: PaymentApi;
  withdrawal: WithdrawalApi;
  notification: NotificationApi;
  admin: AdminApi;
}

export function createApiServices(config: ApiClientConfig): ApiServices {
  const client = new ApiClient(config);
  return {
    client,
    auth: createAuthApi(client),
    user: createUserApi(client),
    lottery: createLotteryApi(client),
    ticket: createTicketApi(client),
    draw: createDrawApi(client),
    winner: createWinnerApi(client),
    wallet: createWalletApi(client),
    payment: createPaymentApi(client),
    withdrawal: createWithdrawalApi(client),
    notification: createNotificationApi(client),
    admin: createAdminApi(client),
  };
}
