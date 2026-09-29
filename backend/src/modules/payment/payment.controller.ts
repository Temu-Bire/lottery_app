import { type Request, type Response } from 'express';
import { paymentService } from './payment.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export class PaymentController {
  create = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await paymentService.createPayment(req.user!.userId, req.body, client);
    sendCreated(res, result, 'Payment initialized successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentService.getPaymentById(req.params.id as string, req.user!);
    sendSuccess(res, payment, 'Payment retrieved successfully');
  };

  webhook = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const providerName = (req.query.provider as string) || (req.params.provider as string) || 'mock';
    const signature = (req.headers['x-signature'] as string) || (req.headers['stripe-signature'] as string) || '';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(
      providerName,
      rawBody,
      signature,
      req.body,
      client,
    );
    sendSuccess(res, result, result.message);
  };
}

export const paymentController = new PaymentController();
