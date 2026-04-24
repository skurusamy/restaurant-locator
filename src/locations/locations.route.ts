import { FastifyInstance } from 'fastify';
import { buildLocationsHandlers } from './controllers/locations.controller';
import {
  getLocationByIdSchema,
  searchLocationsSchema,
  upsertLocationSchema,
} from './schemas/locations.schema';

export async function locationsRoutes(app: FastifyInstance) {
  const handlers = buildLocationsHandlers();

  app.get(
    '/locations/search',
    {
      schema: searchLocationsSchema,
    },
    handlers.searchLocations
  );

  app.get(
    '/locations/:id',
    {
      schema: getLocationByIdSchema,
    },
    handlers.getLocationById
  );

  app.put(
    '/locations/:id',
    {
      schema: upsertLocationSchema,
    },
    handlers.upsertLocation
  );
}
