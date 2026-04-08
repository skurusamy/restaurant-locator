import { FastifyInstance } from 'fastify';
import { LocationsController } from './controllers/locations.controller';
import { LocationsService } from './services/locations.service';
import { LocationsRepository } from './locations.repository';
import {
  searchLocationsSchema,
  getLocationByIdSchema,
} from './locations.schema';

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
}