import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { LocationEntity } from '../db/entities/locations/locations.entity';

export class LocationsRepository {
  private readonly repository: Repository<LocationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(LocationEntity);
  }

  /**
   * Fetch all locations.
   */
  async findAll(): Promise<LocationEntity[]> {
    return this.repository.find();
  }

  /**
   * Fetch a single location by id.
   */
  async findById(id: string): Promise<LocationEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Upsert a location by primary key.
   * Useful for the optional PUT endpoint later.
   */
  async upsert(location: Partial<LocationEntity>): Promise<void> {
    await this.repository.upsert(location, ['id']);
  }
}