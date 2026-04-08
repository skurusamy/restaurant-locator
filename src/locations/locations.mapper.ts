import { LocationEntity } from '../db/entities/locations/locations.entity';
import {
  LocationDetailsResponse,
  LocationSearchItem,
} from './locations.types';

export function toSearchItem(
  entity: LocationEntity,
  distance: number
): LocationSearchItem {
  return {
    id: entity.id,
    name: entity.name,
    coordinates: `x=${entity.x},y=${entity.y}`,
    distance: Number(distance.toFixed(5)),
  };
}

export function toDetailsResponse(
  entity: LocationEntity
): LocationDetailsResponse {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    image: entity.image ?? undefined,
    coordinates: `x=${entity.x},y=${entity.y}`,
    'opening-hours': entity.openingHours ?? undefined,
  };
}
