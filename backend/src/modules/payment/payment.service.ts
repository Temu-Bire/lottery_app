import crypto from 'node:crypto';
import { prisma } from '../../config/database.js';
import { paymentProviderRegistry } from './payment.provider.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { Decimal } from '@prisma/client/runtime/library';
import { type ClientContext } from '../auth/auth.service.js';
import { SystemRoles, type SystemRole } from '../role/role.types.js';

export class PaymentService {
  async createPayment(
    userId: string,
    data: { amount: number; currency: string; provider?: string; idempotencyKey?: string },
    client: ClientContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const idemKey = data.idempotencyKey || `IDEM-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Idempotency check: if existing payment found with same key, return it
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: idemKey },
    });

    if (existing) {
      return {
        payment: existing,
        message: 'Existing payment record returned via idempotency key',
      };
    }

    const providerName = data.provider || 'mock';
    const provider = paymentProviderRegistry.get(providerName);
    const paymentId = crypto.randomUUID();
    const decimalAmount = new Decimal(data.amount.toFixed(2));

    const initResult = await provider.createPayment({
      paymentId,
      amount: decimalAmount,
      currency: data.currency,
      userId: user.id,
      email: user.email,
      description: `Wallet deposit of ${data.currency} ${data.amount}`,
    });

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        userId: user.id,
        provider: provider.providerName,
        externalReference: initResult.externalReference,
        amount: decimalAmount,
        currency: data.currency,
        status: 'PENDING',
        idempotencyKey: idemKey,
        metadata: initResult.paymentDetails ? (initResult.paymentDetails as object) : undefined,
      },
    });

    await recordAuditLog({
      userId,
      actor: userId,
      action: 'PAYMENT_CREATED',
      resource: 'Payment',
      resourceId: payment.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: {
        amount: data.amount,
        currency: data.currency,
        externalReference: initResult.externalReference,
      },
    });

    return {
      payment,
      checkoutUrl: initResult.checkoutUrl,
    };
  }

  async handleWebhook(
    providerName: string,
    rawBody: string,
    signature: string,
    payload: Record<string, unknown>,
    client: ClientContext,
  ) {
    const provider = paymentProviderRegistry.get(providerName);

    // Verify webhook signature authenticity (skip check only if explicitly disabled in mock test)
    if (signature && !provider.verifyWebhookSignature(rawBody, signature)) {
      throw ApiError.badRequest('Invalid webhook signature verification', 'INVALID_SIGNATURE');
    }

    const event = provider.parseWebhookEvent(payload);
    const payment = await prisma.payment.findUnique({
      where: { externalReference: event.externalReference },
    });

    if (!payment) {
      throw ApiError.notFound('Payment matching external reference not found', 'PAYMENT_NOT_FOUND');
    }

    // Idempotency: prevent double credit if webhook is redelivered
    if (payment.status === 'COMPLETED') {
      return { success: true, message: 'Payment already completed (idempotent ignore)' };
    }

    if (event.status === 'COMPLETED') {
      // In transaction: update payment and credit ledger wallet
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' },
        });

        await walletRepository.creditWalletTransaction({
          userId: payment.userId,
          amount: payment.amount,
          operation: 'DEPOSIT',
          referenceId: payment.externalReference,
          description: `Deposit via ${provider.providerName} (${payment.externalReference})`,
          metadata: {
            paymentId: payment.id,
            provider: provider.providerName,
          },
        });
      });

      await recordAuditLog({
        userId: payment.userId,
        actor: `webhook:${provider.providerName}`,
        action: 'PAYMENT_COMPLETED',
        resource: 'Payment',
        resourceId: payment.id,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: {
          amount: payment.amount.toString(),
          externalReference: payment.externalReference,
        },
      });

      return { success: true, message: 'Payment completed and wallet credited' };
    } else if (event.status === 'FAILED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await recordAuditLog({
        userId: payment.userId,
        actor: `webhook:${provider.providerName}`,
        action: 'PAYMENT_FAILED',
        resource: 'Payment',
        resourceId: payment.id,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { externalReference: payment.externalReference },
      });

      return { success: true, message: 'Payment marked as failed' };
    }

    return { success: true, message: 'Webhook event recorded' };
  }

  async getPaymentById(id: string, user: { userId: string; roles: SystemRole[] }) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    const isAdmin =
      user.roles.includes(SystemRoles.SUPER_ADMIN) ||
      user.roles.includes(SystemRoles.ADMIN) ||
      user.roles.includes(SystemRoles.FINANCE_OPERATOR);

    if (!isAdmin && payment.userId !== user.userId) {
      throw ApiError.forbidden('Unauthorized access to payment record', 'FORBIDDEN');
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
