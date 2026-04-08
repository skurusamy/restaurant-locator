import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { LocationEntity } from '../db/entities/locations/locations.entity';

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

  private buildSearchByDistanceQuery(
    userX: number,
    userY: number
  ): SelectQueryBuilder<LocationEntity> {
    const distanceSquaredExpr =
      '(POWER(l.x - :userX, 2) + POWER(l.y - :userY, 2))';

    return this.repository
      .createQueryBuilder('l')
      .where(`${distanceSquaredExpr} <= POWER(l.radius, 2)`)
      .andWhere(':userX BETWEEN l.x - l.radius AND l.x + l.radius')
      .andWhere(':userY BETWEEN l.y - l.radius AND l.y + l.radius')
      .setParameters({ userX, userY });
  }

  public async searchByDistance(
    userX: number,
    userY: number,
    page = 1,
    limit = 10
  ): Promise<SearchLocationsResult> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const offset = (safePage - 1) * safeLimit;
    const distanceExpr =
      'SQRT(POWER(l.x - :userX, 2) + POWER(l.y - :userY, 2))';

    const baseQuery = this.buildSearchByDistanceQuery(userX, userY);
    const total = await baseQuery.getCount();

    const rows = await this.buildSearchByDistanceQuery(userX, userY)
      .select('l.id', 'id')
      .addSelect('l.name', 'name')
      .addSelect('l.x', 'x')
      .addSelect('l.y', 'y')
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
