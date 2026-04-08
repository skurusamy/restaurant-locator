import 'reflect-metadata';
import { AppDataSource } from '../src/db/data-source';
import { LocationEntity } from '../src/db/entities/locations/locations.entity';
import fs from 'fs';
import path from 'path';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('DB connected for seeding');

    const repo = AppDataSource.getRepository(LocationEntity);

    const filePath = path.join(__dirname, '../data/locations.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    const locations = Array.isArray(parsed) ? parsed : parsed.locations;

    if (!Array.isArray(locations)) {
      throw new Error('Invalid locations JSON format');
    }

    const mappedLocations = locations
      .map((loc) => {
        if (!loc.coordinates) return null;

        const parts = loc.coordinates.split(',');
        if (parts.length !== 2) return null;

        const x = Number(parts[0].split('=')[1]);
        const y = Number(parts[1].split('=')[1]);

        if (isNaN(x) || isNaN(y)) return null;

        return {
          id: loc.id,
          name: loc.name,
          x,
          y,
          radius: loc.radius,
          type: loc.type,
          image: loc.image,
          openingHours: loc['opening-hours']
        };
      })
      .filter(Boolean); // remove invalid records

    await repo.upsert(mappedLocations as LocationEntity[], ['id']);

    console.log(`Seeded ${mappedLocations.length} locations`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();