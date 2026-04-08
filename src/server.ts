import 'reflect-metadata';
import { buildApp } from './app';
import { AppDataSource } from './db/data-source';
import { env } from './config/env';

async function start() {
  try {
    await AppDataSource.initialize();

    const app = buildApp();

    await app.listen({
      port: env.server.port,
      host: '0.0.0.0',
    });

    app.log.info('Database connected');
    app.log.info(`Server running at http://localhost:${env.server.port}`);
    app.log.info(`Swagger available at http://localhost:${env.server.port}/docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
