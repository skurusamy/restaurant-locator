import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { LocationEntity } from './entities/locations/locations.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  synchronize: process.env.NODE_ENV !== 'production',

  logging: false,

  entities: [LocationEntity],

  migrations: ['src/db/migrations/*.ts'],
});