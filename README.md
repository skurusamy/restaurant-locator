# Bonial Technical Challenge - Restaurant Locator API

This repository contains an API implementation for the Bonial technical challenge to create an application to help users find the closest restaurant.

A restaurant is considered visible when:

- the restaurant has coordinates on the first quadrant of the Cartesian plane
- the restaurant coordinates are non-negative integers
- the restaurant has a positive integer radius
- the distance from the user to the restaurant is less than or equal to the restaurant radius

## What This Project Covers

### SHOULD requirements

- implemented in Node.js
- built with Fastify
- implements `GET /locations/search`
- implements `GET /locations/:id`
- reads and processes locations from a provided JSON file
- includes tests
- includes API validation
- provides an OpenAPI schema

### NICE requirements

- includes a clear README with run instructions
- includes `PUT /locations/:id` to dynamically add or update restaurants
- includes proper error handling and HTTP status codes
- considers larger datasets using database-side filtering, sorting, and pagination
- explains technical decisions

## Tech Stack

- Node.js
- Fastify
- TypeScript
- PostgreSQL
- TypeORM
- Mocha + Chai
- Swagger / OpenAPI

## API Guide

## 1. Search visible restaurants

```text
GET /locations/search?x=3&y=2
```

Required query parameters:

- `x`
- `y`

Optional query parameters:

- `page`
- `limit`

This endpoint returns:

- the user coordinates
- the visible restaurants
- each restaurant's distance from the user

The restaurants are sorted by distance in ascending order.

Example response:

```json
{
  "user-location": "x=3,y=2",
  "locations": [
    {
      "id": "21e1545c-8b65-4d83-82f9-7fcad4a23114",
      "name": "Deseado Steakhaus",
      "coordinates": "x=2,y=2",
      "distance": 1
    },
    {
      "id": "20e1545c-8b65-4d83-82f9-7fcad4a23114",
      "name": "Fire Tiger",
      "coordinates": "x=2,y=3",
      "distance": 1.41421
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 2
}
```

Validation rules:

- `x` must be a non-negative integer
- `y` must be a non-negative integer
- `page` must be at least `1`
- `limit` must be between `1` and `50`

### How this endpoint works

- The search is performed in the database so the API does not need to load all restaurants into memory first.
- The database is queried once to count matching restaurants and once to fetch the current paginated result set.
- Visibility filtering uses a squared-distance comparison, while the final returned distance uses Euclidean distance.
- Only the fields needed for the search response are selected.
- Pagination was added as an optional enhancement because the challenge mentions larger datasets, and it helps avoid returning very large responses at once.

## 2. Get one restaurant by id

```text
GET /locations/51e1545c-8b65-4d83-82f9-7fcad4a23111
```

Example response:

```json
{
  "name": "Da Jia Le",
  "type": "Restaurant",
  "id": "51e1545c-8b65-4d83-82f9-7fcad4a23111",
  "opening-hours": "10:00AM-11:00PM",
  "image": "https://tinyurl.com",
  "coordinates": "x=5,y=5"
}
```

Validation rules:

- `id` must be a valid UUID

## 3. Add or update a restaurant

This is the nice-to-have endpoint from the challenge.

```text
PUT /locations/51e1545c-8b65-4d83-82f9-7fcad4a23111
```

Request body:

```json
{
  "name": "Da Jia Le",
  "type": "Restaurant",
  "id": "51e1545c-8b65-4d83-82f9-7fcad4a23111",
  "opening-hours": "10:00AM-11:00PM",
  "image": "https://tinyurl.com",
  "coordinates": "x=5,y=5",
  "radius": 1
}
```

Validation rules:

- path `id` and body `id` must match
- `coordinates` must follow `x=<non-negative integer>,y=<non-negative integer>`
- `radius` must be a positive integer

## 4. Health check

```text
GET /health
```

This endpoint is only for local verification and is not part of the challenge itself.

## Developer Guide

## Prerequisites

You need:

- Node.js
- npm
- Docker Desktop

## Step 1. Install dependencies

```bash
npm install
```

## Step 2. Create the environment file

Create a `.env` file in the project root using the same values as `.env.example`.

Example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant_locator
```

## Step 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts the PostgreSQL container.

## Step 4. Seed the database

```bash
npm run seed
```

This command:

- connects to PostgreSQL
- initializes the schema through TypeORM if needed
- reads restaurant data from the JSON file
- validates the input records
- upserts the restaurants into the database

If PostgreSQL has just started and the seed command fails immediately, wait a few seconds and run it again.

## Step 5. Run the API

For development:

```bash
npm run dev
```

For build + start:

```bash
npm run build
npm start
```

## Step 6. Open the API documentation

```text
http://localhost:3000/docs
```

## Test Framework

The project uses:

- `Mocha` as the test runner
- `Chai` for assertions
- `ts-node` so tests can run directly against TypeScript files

Run tests with:

```bash
npm test
```

The tests currently cover:

- search behavior
- sort order
- validation failures
- get-by-id behavior
- create/update behavior for the `PUT` endpoint

## Seed Script

The seed script is:

```text
scripts/seed-locations.ts
```

What it does:

1. initializes the database connection
2. reads the source JSON file
3. validates coordinate and radius formats
4. maps the API-style JSON shape into the database entity shape
5. upserts the data in batches

At the moment, the script reads from:

```text
data/locations_big.json
```

You can switch that path if you want to seed from a different dataset.

## Project Structure

Yes, it is worth including a short structure section in the README because it helps reviewers understand the codebase quickly without overexplaining it.

Current structure:

```text
src/
  app.ts
  server.ts
  common/
  config/
  db/
  locations/
    controllers/
    mappers/
    repositories/
    schemas/
    services/
    types/
    locations.route.ts
scripts/
data/
test/
```

## OpenAPI / Swagger

Swagger UI is available at:

```text
http://localhost:3000/docs
```

This is generated from the Fastify route schemas.

## Error Handling

The API returns structured errors and proper HTTP status codes:

- `200` for success
- `400` for invalid input
- `404` for missing resources
- `500` for unexpected server errors

Example error response:

```json
{
  "errorType": "Bad Request",
  "message": "Path parameter 'id' must be a valid UUID."
}
```

## Technical Rationale

- `PostgreSQL`: I used PostgreSQL because the challenge mentions that the solution may be tested with bigger datasets. A database-backed approach is a better fit than keeping everything only in memory.

- `Database-side filtering and sorting`: The search endpoint performs visibility filtering and distance ordering in the data layer rather than loading all locations into memory first. This is a better starting point for larger datasets.

- `Seed script`: I kept the provided JSON file as the input source and added a seed script to load it into the database. The script validates coordinates, maps the JSON fields into entity fields, and upserts records in batches so it works for both sample and larger datasets.

- `Test framework`: I used Mocha and Chai because they are lightweight, straightforward for API testing, and work well with TypeScript through `ts-node`.

- `Distance calculation`: The distance logic uses standard Euclidean distance, `sqrt((x1 - x2)^2 + (y1 - y2)^2)`, which matches the challenge definition of visibility based on geometric distance.

- `Pagination`: I added pagination to the search endpoint as an optional enhancement. The challenge mentions bigger datasets, so pagination helps avoid returning very large responses at once while preserving the required behavior of returning visible restaurants sorted by distance.
