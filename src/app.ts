import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { locationsRoutes } from './locations/locations.route';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  /**
   * Register Swagger (OpenAPI)
   */
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Restaurant Locator API',
        description: 'API to search nearby restaurants',
        version: '1.0.0',
      },
    },
  });

  /**
   * Swagger UI
   */
  app.register(swaggerUI, {
    routePrefix: '/docs',
  });

  /**
   * Health endpoint (global, not domain-specific)
   */
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    const message =
      error instanceof Error ? error.message : 'Internal Server Error';

    const errorType =
      statusCode === 400
        ? 'Bad Request'
        : statusCode === 404
          ? 'Not Found'
          : 'Internal Server Error';

    reply.status(statusCode).send({
      errorType,
      message,
    });
  });

  /**
   * Register domain routes
   */
  app.register(locationsRoutes);

  return app;
}
