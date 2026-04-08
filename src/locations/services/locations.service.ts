import { LocationsRepository } from '../locations.repository';
import { calculateDistance } from '../../common/utils/distance';
import { toDetailsResponse, toSearchItem } from '../locations.mapper';
import {
  LocationDetailsResponse,
  LocationSearchResponse,
} from '../locations.types';

export class LocationsService {
  constructor(private readonly locationsRepository: LocationsRepository) {}

  /**
   * Search visible locations from the given user coordinates.
   *
   * A location is visible if distance(user, location) <= location.radius.
   */
  public async searchLocations(
    userX: number,
    userY: number,
    page = 1,
    limit = 10
  ): Promise<LocationSearchResponse> {
    // Defensive normalization for pagination
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const locations = await this.locationsRepository.findAll();

    // Calculate distance for each location and keep only visible ones
    const visibleLocations = locations
      .map((location) => {
        const distance = calculateDistance(userX, userY, location.x, location.y);

        return {
          location,
          distance,
        };
      })
      .filter(({ location, distance }) => distance <= location.radius)
      .sort((a, b) => a.distance - b.distance);

    const total = visibleLocations.length;
    const startIndex = (safePage - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;

    const paginatedLocations = visibleLocations.slice(startIndex, endIndex);

    return {
      'user-location': `x=${userX},y=${userY}`,
      locations: paginatedLocations.map(({ location, distance }) =>
        toSearchItem(location, distance)
      ),
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