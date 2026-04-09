import dotenv from 'dotenv';

const envFiles = process.env.NODE_ENV === 'test'
  ? ['.env.test', '.env']
  : ['.env'];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile });
}

export const env = {
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'restaurant_locator',
  },
};
