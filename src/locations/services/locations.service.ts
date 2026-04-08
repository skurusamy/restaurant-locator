import { LocationsRepository } from '../locations.repository';
import { toDetailsResponse } from '../locations.mapper';
import {
  LocationDetailsResponse,
  LocationSearchResponse,
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
}