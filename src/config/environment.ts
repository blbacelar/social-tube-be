import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  OPENAI_API_KEY: z.string(),
  DATABASE_URL: z.string(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100'),
  FACEBOOK_APP_ID: z.string(),
  FACEBOOK_APP_SECRET: z.string(),
  FACEBOOK_ACCESS_TOKEN: z.string(),
});

const env = envSchema.parse(process.env);

export default {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  openAiApiKey: env.OPENAI_API_KEY,
  databaseUrl: env.DATABASE_URL,
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.RATE_LIMIT_MAX, 10),
  },
  facebook: {
    appId: env.FACEBOOK_APP_ID,
    appSecret: env.FACEBOOK_APP_SECRET,
    accessToken: env.FACEBOOK_ACCESS_TOKEN,
  },
}; 