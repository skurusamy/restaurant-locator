import { SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { LocationEntity } from '../../db/entities/locations/locations.entity';

export interface SearchLocationRow {
  id: string;
  name: string;
  x: number;
  y: number;
  distance: number;
}

export interface SearchLocationsResult {
  rows: SearchLocationRow[];
  total: number;
}

export interface UpsertLocationInput {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  type?: string;
  image?: string;
  openingHours?: string;
}

function getLocationsRepository() {
  return AppDataSource.getRepository(LocationEntity);
}

function buildSearchByDistanceQuery(
  userX: number,
  userY: number
): SelectQueryBuilder<LocationEntity> {
  const distanceSquaredExpr = '(POWER(loc.x - :userX, 2) + POWER(loc.y - :userY, 2))';

  return getLocationsRepository()
    .createQueryBuilder('loc')
    .where(`${distanceSquaredExpr} <= POWER(loc.radius, 2)`)
    .andWhere(':userX BETWEEN loc.x - loc.radius AND loc.x + loc.radius')
    .andWhere(':userY BETWEEN loc.y - loc.radius AND loc.y + loc.radius')
    .setParameters({ userX, userY });
}

export async function findLocationById(id: string): Promise<LocationEntity | null> {
  return getLocationsRepository().findOne({
    where: { id },
  });
}

export async function searchLocationsByDistance(
  userX: number,
  userY: number,
  page = 1,
  limit = 10
): Promise<SearchLocationsResult> {
  const offset = (page - 1) * limit;
  const distanceExpr = 'SQRT(POWER(loc.x - :userX, 2) + POWER(loc.y - :userY, 2))';

  const total = await buildSearchByDistanceQuery(userX, userY).getCount();

  const rows = await buildSearchByDistanceQuery(userX, userY)
    .select('loc.id', 'id')
    .addSelect('loc.name', 'name')
    .addSelect('loc.x', 'x')
    .addSelect('loc.y', 'y')
    .addSelect(distanceExpr, 'distance')
    .orderBy('distance', 'ASC')
    .addOrderBy('loc.id', 'ASC')
    .offset(offset)
    .limit(limit)
    .getRawMany<SearchLocationRow>();

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      x: Number(row.x),
      y: Number(row.y),
      distance: Number(row.distance),
    })),
    total,
  };
}

export async function upsertLocation(location: UpsertLocationInput): Promise<void> {
  await getLocationsRepository().upsert(location, ['id']);
}
