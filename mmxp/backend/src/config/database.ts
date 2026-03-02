import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User';
import { Event } from '../entities/Event';
import { Attendance } from '../entities/Attendance';
import { MagicLink } from '../entities/MagicLink';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: env.isDev,
  logging: env.isDev,
  entities: [User, Event, Attendance, MagicLink],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'mmxp_migrations',
  ssl: env.isDev ? false : { rejectUnauthorized: false },
});

export async function initDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}
