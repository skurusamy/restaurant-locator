import { FastifyReply, FastifyRequest } from 'fastify';
import { LocationsService } from '../services/locations.service';
import { SearchLocationsQuery, UpsertLocationRequest } from '../locations.types';

interface GetLocationByIdParams {
  id: string;
}

export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * GET /locations/search
   *
   * Validation for x, y, page, and limit is handled by Fastify schema.
   */
  public async searchLocations(
    request: FastifyRequest<{ Querystring: SearchLocationsQuery }>,
    reply: FastifyReply
  ) {
    const { x, y, page = 1, limit = 10 } = request.query;

    const result = await this.locationsService.searchByDistance(
      Number(x),
      Number(y),
      Number(page),
      Number(limit)
    );

    return reply.status(200).send(result);
  }

  /**
   * GET /locations/:id
   *
   * Validation for id format is handled by Fastify schema.
   */
  public async getLocationById(
    request: FastifyRequest<{ Params: GetLocationByIdParams }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const location = await this.locationsService.getLocationById(id);

    if (!location) {
      return reply.status(404).send({
        errorType: 'Not Found',
        message: 'Location not found.',
      });
    }

    return reply.status(200).send(location);
  }

  public async upsertLocation(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpsertLocationRequest;
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const payload = request.body;

  const result = await this.locationsService.upsertLocation(id, payload);

  return reply.status(200).send(result);
}
}