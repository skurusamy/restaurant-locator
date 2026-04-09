import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { locationsRoutes } from './locations/locations.route';
import { registerGlobalErrorHandler } from './common/errors/error-handler';

export function buildApp() {
  const isTest = process.env.NODE_ENV === 'test';

  const app = Fastify({
    logger: isTest ? false : true,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Restaurant Locator API',
        description: 'API to search nearby restaurants',
        version: '1.0.0',
      },
    },
  });

  app.register(swaggerUI, {
    routePrefix: '/docs',
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  registerGlobalErrorHandler(app);

  app.register(locationsRoutes);

  return app;
}
