import 'reflect-metadata';
import { buildApp } from './app';
import { AppDataSource } from './db/data-source';
import { env } from './config/env';

async function start() {
  try {
    /**
     * Initialize database connection
     */
    await AppDataSource.initialize();
    console.log('Database connected');

    /**
     * Build Fastify app
     */
    const app = buildApp();

    /**
     * Start server
     */
    await app.listen({
      port: env.server.port,
      host: '0.0.0.0',
    });

    console.log(`Server running at http://localhost:${env.server.port}`);
    console.log(`Swagger available at http://localhost:${env.server.port}/docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
