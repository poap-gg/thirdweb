const isDev = (process.env['NODE_ENV'] ?? 'development') !== 'production';

function requireProd(name: string): string {
  const value = process.env[name];
  if (!value && !isDev) throw new Error(`Missing required environment variable: ${name}`);
  return value ?? '';
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4001'), 10),

  // Not needed in dev — in-memory store is used instead of Postgres
  DATABASE_URL: requireProd('DATABASE_URL'),

  REDIS_HOST: optional('REDIS_HOST', '127.0.0.1'),
  REDIS_PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optional('REDIS_PASSWORD'),

  // Dev falls back to hard-coded secrets — set real values in production
  SESSION_SECRET: optional('SESSION_SECRET', 'dev-secret-change-in-prod'),
  HASHID_SALT: optional('HASHID_SALT', 'dev-salt-change-in-prod'),

  // Not needed in dev — emails are skipped and the URL is returned directly
  SENDGRID_KEY_ID: requireProd('SENDGRID_KEY_ID'),
  SENDGRID_KEY: requireProd('SENDGRID_KEY'),
  EMAIL_FROM: optional('EMAIL_FROM', 'noreply@localhost'),

  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3001'),

  get isDev(): boolean {
    return this.NODE_ENV !== 'production';
  },
};
