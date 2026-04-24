import { MAX_INT_32 } from '../../common/constants/constants';
import { toDetailsResponse, toSearchItem, toUpsertResponse } from '../mappers/locations.mapper';
import {
  findLocationById,
  SearchLocationsResult,
  searchLocationsByDistance,
  upsertLocation as persistLocation,
  UpsertLocationInput,
} from '../repositories/locations.repository';
import {
  LocationDetailsResponse,
  LocationSearchResponse,
  UpsertLocationRequest,
  UpsertLocationResponse,
} from '../types/locations.types';

export interface LocationsStore {
  searchByDistance: (
    userX: number,
    userY: number,
    page: number,
    limit: number
  ) => Promise<SearchLocationsResult>;
  findById: (id: string) => ReturnType<typeof findLocationById>;
  upsert: (location: UpsertLocationInput) => Promise<void>;
}

const defaultLocationsStore: LocationsStore = {
  searchByDistance: searchLocationsByDistance,
  findById: findLocationById,
  upsert: persistLocation,
};

function getLocationsStore(store?: LocationsStore): LocationsStore {
  return store ?? defaultLocationsStore;
}

function parseCoordinates(coordinates: string): { x: number; y: number } {
  const coordinatePattern = /^x=(\d+),y=(\d+)$/;
  const match = coordinatePattern.exec(coordinates);

  if (!match) {
    throw Object.assign(
      new Error('Coordinates must be in the format x=<non-negative integer>,y=<non-negative integer>.'),
      {
        statusCode: 400,
      }
    );
  }

  const x = Number(match[1]);
  const y = Number(match[2]);

  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    throw Object.assign(
      new Error('Coordinates must contain valid non-negative integer x and y values.'),
      {
        statusCode: 400,
      }
    );
  }

  if (x > MAX_INT_32 || y > MAX_INT_32) {
    throw Object.assign(
      new Error(`Coordinates must be within supported integer range (0 to ${MAX_INT_32}).`),
      {
        statusCode: 400,
      }
    );
  }

  return { x, y };
}

export async function searchLocations(
  userX: number,
  userY: number,
  page = 1,
  limit = 10,
  store?: LocationsStore
): Promise<LocationSearchResponse> {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const { rows, total } = await getLocationsStore(store).searchByDistance(
    userX,
    userY,
    safePage,
    safeLimit
  );

  return {
    'user-location': `x=${userX},y=${userY}`,
    locations: rows.map(toSearchItem),
    page: safePage,
    limit: safeLimit,
    total,
  };
}

export async function getLocationDetails(
  id: string,
  store?: LocationsStore
): Promise<LocationDetailsResponse | null> {
  const location = await getLocationsStore(store).findById(id);

  if (!location) {
    return null;
  }

  return toDetailsResponse(location);
}

export async function saveLocation(
  pathId: string,
  payload: UpsertLocationRequest,
  store?: LocationsStore
): Promise<UpsertLocationResponse> {
  if (pathId !== payload.id) {
    throw Object.assign(new Error('Path id must match body id.'), {
      statusCode: 400,
    });
  }

  const { x, y } = parseCoordinates(payload.coordinates);
  const locationsStore = getLocationsStore(store);

  await locationsStore.upsert({
    id: payload.id,
    name: payload.name,
    x,
    y,
    radius: payload.radius,
    type: payload.type,
    image: payload.image,
    openingHours: payload['opening-hours'],
  });

  const savedLocation = await locationsStore.findById(payload.id);

  if (!savedLocation) {
    throw Object.assign(new Error('Failed to persist location.'), {
      statusCode: 500,
    });
  }

  return toUpsertResponse(savedLocation);
}
