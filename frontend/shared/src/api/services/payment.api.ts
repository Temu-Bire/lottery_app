import { ApiClient } from '../client.js';
import { Payment, CreatePaymentRequest } from '../../types/payment.js';

export const createPaymentApi = (client: ApiClient) => ({
  create: (data: CreatePaymentRequest): Promise<{ payment: Payment; checkoutUrl?: string }> =>
    client.post<{ payment: Payment; checkoutUrl?: string }>('/payments', data),

  getById: (id: string): Promise<Payment> =>
    client.get<Payment>(`/payments/${id}`),
});

export type PaymentApi = ReturnType<typeof createPaymentApi>;
