import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z
    .string()
    .default('postgresql://lottery_user:lottery_password@localhost:5432/lottery_db?schema=public'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().min(16).default('development-jwt-access-secret-minimum-16-chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development-jwt-refresh-secret-minimum-16-chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().default('test_telegram_bot_token_secret_12345'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
