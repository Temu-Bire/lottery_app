import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  firstName: z.string().trim().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(50).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format e.g. +1234567890)')
    .optional()
    .or(z.literal('')),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});

export const depositSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Deposit amount must be positive')
    .min(1, 'Minimum deposit is 1.00')
    .max(100000, 'Maximum single deposit is 100,000.00'),
  currency: z.string().trim().length(3).default('ETB'),
});

export const withdrawalSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Withdrawal amount must be positive')
    .min(10, 'Minimum withdrawal is 10.00')
    .max(50000, 'Maximum single withdrawal is 50,000.00'),
  currency: z.string().trim().length(3).default('ETB'),
  destinationType: z.enum(['BANK_TRANSFER', 'CRYPTO', 'TELEGRAM_WALLET']),
  accountNumber: z.string().min(3, 'Account / wallet reference is required'),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
});
