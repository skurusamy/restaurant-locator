import { toDetailsResponse, toSearchItem } from '../mappers/locations.mapper';
import { LocationsRepository } from '../repositories/locations.repository';
import {
  LocationDetailsResponse,
  LocationSearchResponse,
  UpsertLocationRequest,
} from '../types/locations.types';

export class LocationsService {
  constructor(private readonly locationsRepository: LocationsRepository) { }

  private parseCoordinates(coordinates: string): { x: number; y: number } {
    const coordinatePattern = /^x=(\d+),y=(\d+)$/;
    const match = coordinatePattern.exec(coordinates);

    if (!match) {
      throw Object.assign(
        new Error('Coordinates must be in the format x=<non-negative integer>,y=<non-negative integer>.'), {
        statusCode: 400
      }
      );
    }

    const x = Number(match[1]);
    const y = Number(match[2]);

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw Object.assign(
        new Error('Coordinates must contain non-negative integer x and y values.'),
        {
          statusCode: 400,
        }
      );
    }

    return { x, y };
  }

  public async searchByDistance(userX: number, userY: number, page = 1, limit = 10): Promise<LocationSearchResponse> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const { rows, total } = await this.locationsRepository.searchByDistance(userX, userY, safePage, safeLimit);

    return {
      'user-location': `x=${userX},y=${userY}`,
      locations: rows.map(toSearchItem),
      page: safePage,
      limit: safeLimit,
      total,
    };
  }

  public async getLocationById(id: string): Promise<LocationDetailsResponse | null> {
    const location = await this.locationsRepository.findById(id);

    if (!location) {
      return null;
    }

    return toDetailsResponse(location);
  }

  public async upsertLocation(pathId: string, payload: UpsertLocationRequest): Promise<LocationDetailsResponse> {
    if (pathId !== payload.id) {
      throw Object.assign(new Error('Path id must match body id.'), {
        statusCode: 400,
      });
    }

    const { x, y } = this.parseCoordinates(payload.coordinates);

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
