import { FastifyInstance } from 'fastify';
import { LocationsController } from './controllers/locations.controller';
import { LocationsRepository } from './repositories/locations.repository';
import {
  getLocationByIdSchema,
  searchLocationsSchema,
  upsertLocationSchema,
} from './schemas/locations.schema';
import { LocationsService } from './services/locations.service';

export async function locationsRoutes(app: FastifyInstance) {
  const repository = new LocationsRepository();
  const service = new LocationsService(repository);
  const controller = new LocationsController(service);

  app.get(
    '/locations/search',
    {
      schema: searchLocationsSchema,
    },
    controller.searchLocations.bind(controller)
  );

  app.get(
    '/locations/:id',
    {
      schema: getLocationByIdSchema,
    },
    controller.getLocationById.bind(controller)
  );

  app.put(
    '/locations/:id',
    {
      schema: upsertLocationSchema,
    },
    controller.upsertLocation.bind(controller)
  );
}
