import 'reflect-metadata';
import { AppDataSource } from '../src/db/data-source';
import { LocationEntity } from '../src/db/entities/locations/locations.entity';
import fs from 'fs';
import path from 'path';

const UPSERT_BATCH_SIZE = 500;

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('DB connected for seeding');

    const repo = AppDataSource.getRepository(LocationEntity);

    const filePath = path.join(__dirname, '../data/same_coordinates_1000.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    const locations = Array.isArray(parsed) ? parsed : parsed.locations;

    if (!Array.isArray(locations)) {
      throw new Error('Invalid locations JSON format');
    }

    const mappedLocations = locations
      .map((loc) => {
        if (!loc.coordinates) return null;

        const coordinatePattern = /^x=(\d+),y=(\d+)$/;
        const coordinateMatch = coordinatePattern.exec(loc.coordinates);
        if (!coordinateMatch) return null;

        const x = Number(coordinateMatch[1]);
        const y = Number(coordinateMatch[2]);

        if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
        if (!Number.isInteger(loc.radius) || loc.radius <= 0) return null;

        return {
          id: loc.id,
          name: loc.name,
          x,
          y,
          radius: loc.radius,
          type: loc.type,
          image: loc.image,
          openingHours: loc['opening-hours'],
        };
      })
      .filter(Boolean); // remove invalid records

    for (let index = 0; index < mappedLocations.length; index += UPSERT_BATCH_SIZE) {
      const batch = mappedLocations.slice(index, index + UPSERT_BATCH_SIZE) as LocationEntity[];
      await repo.upsert(batch, ['id']);
      console.log(
        `Seeded batch ${Math.floor(index / UPSERT_BATCH_SIZE) + 1} (${Math.min(index + UPSERT_BATCH_SIZE, mappedLocations.length)}/${mappedLocations.length})`
      );
    }

    console.log(`Seeded ${mappedLocations.length} locations`);
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

seed();
