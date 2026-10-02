import { PaginationQuery } from './api.js';
import { Lottery } from './lottery.js';

export type TicketStatus = 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED';

export interface TicketItem {
  selectedNumbers: number[];
  bonusNumbers?: number[];
}

export interface PurchaseTicketsRequest {
  tickets: TicketItem[];
  idempotencyKey?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  lotteryId: string;
  userId: string;
  purchaseReference: string;
  price: number | string;
  selectedNumbers: number[];
  bonusNumbers: number[];
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  lottery?: Lottery;
}

export interface TicketListQuery extends PaginationQuery {
  lotteryId?: string;
  userId?: string;
  status?: TicketStatus;
  ticketNumber?: string;
}
