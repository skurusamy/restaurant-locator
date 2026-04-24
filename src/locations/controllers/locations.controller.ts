import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getLocationDetails,
  LocationsStore,
  saveLocation,
  searchLocations,
} from '../services/locations.service';
import {
  SearchLocationsQuery,
  UpsertLocationRequest,
} from '../types/locations.types';

interface GetLocationByIdParams {
  id: string;
}

export function buildLocationsHandlers(store?: LocationsStore) {
  return {
    async searchLocations(
      request: FastifyRequest<{ Querystring: SearchLocationsQuery }>,
      reply: FastifyReply
    ) {
      const { x, y, page = 1, limit = 10 } = request.query;
      const result = await searchLocations(x, y, page, limit, store);

      return reply.status(200).send(result);
    },

    async getLocationById(
      request: FastifyRequest<{ Params: GetLocationByIdParams }>,
      reply: FastifyReply
    ) {
      const { id } = request.params;
      const location = await getLocationDetails(id, store);

      if (!location) {
        return reply.status(404).send({
          errorType: 'Not Found',
          message: 'Location not found.',
        });
      }

      return reply.status(200).send(location);
    },

    async upsertLocation(
      request: FastifyRequest<{ Params: { id: string }; Body: UpsertLocationRequest }>,
      reply: FastifyReply
    ) {
      const { id } = request.params;
      const result = await saveLocation(id, request.body, store);

      return reply.status(200).send(result);
    },
  };
}
