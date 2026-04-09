import { LocationEntity } from "../../db/entities/locations/locations.entity";
import { SearchLocationRow } from "../repositories/locations.repository";
import {
  LocationDetailsResponse,
  LocationSearchItem,
  UpsertLocationResponse,
} from "../types/locations.types";

export function toSearchItem(row: SearchLocationRow): LocationSearchItem {
  return {
    id: row.id,
    name: row.name,
    coordinates: `x=${row.x},y=${row.y}`,
    distance: Number(row.distance.toFixed(5)),
  };
}

export function toDetailsResponse(entity: LocationEntity): LocationDetailsResponse {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    image: entity.image ?? undefined,
    coordinates: `x=${entity.x},y=${entity.y}`,
    "opening-hours": entity.openingHours ?? undefined,
  };
}

export function toUpsertResponse(entity: LocationEntity): UpsertLocationResponse {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    image: entity.image ?? undefined,
    coordinates: `x=${entity.x},y=${entity.y}`,
    radius: entity.radius,
    "opening-hours": entity.openingHours ?? undefined,
  };
}
