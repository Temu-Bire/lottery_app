import crypto from 'node:crypto';
import {
  type IPaymentProvider,
  type CreatePaymentParams,
  type PaymentInitResult,
  type WebhookVerificationResult,
} from './payment.types.js';
import { Decimal } from '@prisma/client/runtime/library';

export class MockPaymentProvider implements IPaymentProvider {
  readonly providerName = 'mock';
  private readonly webhookSecret = 'mock-webhook-secret-key-12345';

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitResult> {
    const externalReference = `MOCK-PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    return {
      externalReference,
      checkoutUrl: `https://checkout.mockgateway.internal/pay/${externalReference}`,
      paymentDetails: {
        provider: this.providerName,
        paymentId: params.paymentId,
        amount: params.amount.toString(),
        currency: params.currency,
      },
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookVerificationResult {
    const externalReference = payload.externalReference as string;
    const status = (payload.status as string)?.toUpperCase();
    const amountVal = payload.amount ? new Decimal(payload.amount.toString()) : undefined;

    let mappedStatus: 'COMPLETED' | 'FAILED' | 'REFUNDED' = 'COMPLETED';
    if (status === 'FAILED') mappedStatus = 'FAILED';
    if (status === 'REFUNDED') mappedStatus = 'REFUNDED';

    return {
      isValid: true,
      externalReference,
      status: mappedStatus,
      amount: amountVal,
      metadata: payload.metadata as Record<string, unknown>,
    };
  }

  async verifyPaymentStatus(externalReference: string): Promise<WebhookVerificationResult> {
    return {
      isValid: true,
      externalReference,
      status: 'COMPLETED',
    };
  }
}

export class PaymentProviderRegistry {
  private providers = new Map<string, IPaymentProvider>();

  constructor() {
    this.register(new MockPaymentProvider());
  }

  register(provider: IPaymentProvider): void {
    this.providers.set(provider.providerName.toLowerCase(), provider);
  }

  get(name: string): IPaymentProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      // Default to mock if unspecified or provider not configured
      return this.providers.get('mock')!;
    }
    return provider;
  }
}

export const paymentProviderRegistry = new PaymentProviderRegistry();
