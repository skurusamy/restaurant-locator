import { Repository, SelectQueryBuilder } from 'typeorm';
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

export class LocationsRepository {
  private readonly repository: Repository<LocationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(LocationEntity);
  }

  public async findById(id: string): Promise<LocationEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  private buildSearchByDistanceQuery(userX: number, userY: number): SelectQueryBuilder<LocationEntity> {
    const distanceSquaredExpr = '(POWER(loc.x - :userX, 2) + POWER(loc.y - :userY, 2))';

    return this.repository
      .createQueryBuilder('loc')
      .where(`${distanceSquaredExpr} <= POWER(loc.radius, 2)`)
      .andWhere(':userX BETWEEN loc.x - loc.radius AND loc.x + loc.radius')
      .andWhere(':userY BETWEEN loc.y - loc.radius AND loc.y + loc.radius')
      .setParameters({ userX, userY });
  }

  public async searchByDistance(userX: number, userY: number, safePage = 1, safeLimit = 10): Promise<SearchLocationsResult> {
    const offset = (safePage - 1) * safeLimit;
    const distanceExpr = 'SQRT(POWER(loc.x - :userX, 2) + POWER(loc.y - :userY, 2))';

    const baseQuery = this.buildSearchByDistanceQuery(userX, userY);
    const total = await baseQuery.getCount();

    const rows = await this.buildSearchByDistanceQuery(userX, userY)
      .select('loc.id', 'id')
      .addSelect('loc.name', 'name')
      .addSelect('loc.x', 'x')
      .addSelect('loc.y', 'y')
      .addSelect(distanceExpr, 'distance')
      .orderBy('distance', 'ASC')
      .offset(offset)
      .limit(safeLimit)
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

  public async upsert(location: Partial<LocationEntity>): Promise<void> {
    await this.repository.upsert(location, ['id']);
  }
}
