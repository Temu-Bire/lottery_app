export const LOTTERY_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
  SCHEDULED: { label: 'Scheduled', color: '#3b82f6', bg: '#eff6ff' },
  OPEN: { label: 'Active', color: '#10b981', bg: '#ecfdf5' },
  CLOSED: { label: 'Closed', color: '#f59e0b', bg: '#fffbeb' },
  DRAWING: { label: 'Drawing', color: '#8b5cf6', bg: '#f5f3ff' },
  COMPLETED: { label: 'Completed', color: '#059669', bg: '#ecfdf5' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
};

export const TICKET_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: { label: 'In Play', color: '#3b82f6', bg: '#eff6ff' },
  WON: { label: 'Winner', color: '#10b981', bg: '#ecfdf5' },
  LOST: { label: 'No Win', color: '#6b7280', bg: '#f3f4f6' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
  REFUNDED: { label: 'Refunded', color: '#8b5cf6', bg: '#f5f3ff' },
};

export const TRANSACTION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
  FAILED: { label: 'Failed', color: '#ef4444', bg: '#fef2f2' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
};

export const WITHDRAWAL_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb' },
  PROCESSING: { label: 'Processing', color: '#3b82f6', bg: '#eff6ff' },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
  FAILED: { label: 'Failed', color: '#ef4444', bg: '#fef2f2' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
};
