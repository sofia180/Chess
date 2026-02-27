import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(500),
  REFERRAL_FEE_SHARE_BPS: z.coerce.number().int().min(0).max(10_000).default(1000),
  ADMIN_API_KEY: z.string().min(1),
  WEB_ORIGIN: z.string().default('http://localhost:3000')
});

export const env = EnvSchema.parse(process.env);

