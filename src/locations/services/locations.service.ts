import { LocationsRepository } from '../locations.repository';
import { toDetailsResponse } from '../locations.mapper';
import {
  LocationDetailsResponse,
  LocationSearchResponse,
  UpsertLocationRequest,
} from '../locations.types';

export class LocationsService {
  constructor(private readonly locationsRepository: LocationsRepository) {}

  /**
   * Search visible locations from the given user coordinates.
   *
   * The repository handles:
   * - DB filtering
   * - DB sorting
   * - DB pagination
   *
   * The service handles:
   * - response shaping
   */
  public async searchByDistance(
    userX: number,
    userY: number,
    page = 1,
    limit = 10
  ): Promise<LocationSearchResponse> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const { rows, total } =
      await this.locationsRepository.searchByDistance(
        userX,
        userY,
        safePage,
        safeLimit
      );

    return {
      'user-location': `x=${userX},y=${userY}`,
      locations: rows.map((row) => ({
        id: row.id,
        name: row.name,
        coordinates: `x=${row.x},y=${row.y}`,
        distance: Number(row.distance.toFixed(5)),
      })),
      page: safePage,
      limit: safeLimit,
      total,
    };
  }

  /**
   * Get location details by id.
   */
  public async getLocationById(
    id: string
  ): Promise<LocationDetailsResponse | null> {
    const location = await this.locationsRepository.findById(id);

    if (!location) {
      return null;
    }

    return toDetailsResponse(location);
  }

  public async upsertLocation(
  pathId: string,
  payload: UpsertLocationRequest
): Promise<LocationDetailsResponse> {
  if (pathId !== payload.id) {
    throw Object.assign(new Error('Path id must match body id.'), {
      statusCode: 400,
    });
  }

  const parts = payload.coordinates.split(',');
  if (parts.length !== 2) {
    throw Object.assign(new Error('Coordinates must be in the format x=<number>,y=<number>.'), {
      statusCode: 400,
    });
  }

  const x = Number(parts[0].split('=')[1]);
  const y = Number(parts[1].split('=')[1]);

  if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || y < 0) {
    throw Object.assign(new Error('Coordinates must contain non-negative numeric x and y values.'), {
      statusCode: 400,
    });
  }

  await this.locationsRepository.upsert({
    id: payload.id,
    name: payload.name,
    x,
    y,
    radius: payload.radius,
    type: payload.type,
    image: payload.image,
    openingHours: payload['opening-hours'],
  });

  const savedLocation = await this.locationsRepository.findById(payload.id);

  if (!savedLocation) {
    throw Object.assign(new Error('Failed to persist location.'), {
      statusCode: 500,
    });
  }

  return toDetailsResponse(savedLocation);
}
}