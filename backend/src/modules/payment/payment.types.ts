import { Decimal } from '@prisma/client/runtime/library';

export interface CreatePaymentParams {
  paymentId: string;
  amount: Decimal;
  currency: string;
  userId: string;
  email: string;
  description: string;
}

export interface PaymentInitResult {
  externalReference: string;
  checkoutUrl?: string;
  paymentDetails?: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  externalReference: string;
  status: 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount?: Decimal;
  metadata?: Record<string, unknown>;
}

export interface IPaymentProvider {
  readonly providerName: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentInitResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhookEvent(payload: Record<string, unknown>): WebhookVerificationResult;
  verifyPaymentStatus(externalReference: string): Promise<WebhookVerificationResult>;
}
