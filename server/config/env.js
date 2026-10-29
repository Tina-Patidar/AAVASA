import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // Comma separated list of allowed browser origins
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  COOKIE_NAME: 'aavasa_token',
  // Taxes and fees used by the pricing service (percent values)
  TAX_RATE: Number(process.env.TAX_RATE ?? 12),
  SERVICE_FEE_RATE: Number(process.env.SERVICE_FEE_RATE ?? 3),
};

env.isProd = env.NODE_ENV === 'production';
env.isTest = env.NODE_ENV === 'test';

/** Call from server.js before connecting. Tests set their own values. */
export function assertEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Copy server/.env.example to server/.env and fill them in.`
    );
  }
  if (env.isProd && env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
}
