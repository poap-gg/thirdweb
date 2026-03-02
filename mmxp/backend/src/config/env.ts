function require(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4001'), 10),

  DATABASE_URL: require('DATABASE_URL'),

  REDIS_HOST: optional('REDIS_HOST', '127.0.0.1'),
  REDIS_PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optional('REDIS_PASSWORD'),

  SESSION_SECRET: require('SESSION_SECRET'),
  HASHID_SALT: require('HASHID_SALT'),

  SENDGRID_KEY_ID: require('SENDGRID_KEY_ID'),
  SENDGRID_KEY: require('SENDGRID_KEY'),
  EMAIL_FROM: require('EMAIL_FROM'),

  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3001'),

  get isDev(): boolean {
    return this.NODE_ENV === 'development';
  },
};
