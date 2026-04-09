# Restaurant Locator API

This repository contains an API implementation to create an application to help users find the closest restaurant.

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

This section is meant to help a reviewer or interviewer get the project running quickly without guessing the setup steps.

## Recommended versions

The project was developed locally with:

- `Node.js v22.14.0`
- `npm 11.6.0`
- `Docker 29.4.0`

You do not need those exact versions, but using a recent Node 22+ setup will give the smoothest experience.

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd restaurant-locator
```

## 2. Install dependencies

```bash
npm install
```

## 3. Install Docker

Docker is used only for PostgreSQL in local development.

If Docker is not installed yet, use the official Docker installation guide:

- https://docs.docker.com/get-started/get-docker/

After installing Docker, make sure Docker Desktop is running before continuing.

## 4. Create the environment file

Create a `.env` file in the project root.

You can use the following values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant_locator
```

These values match the PostgreSQL container defined in `docker-compose.yml`.

## 5. Start PostgreSQL with Docker

```bash
docker compose up -d
```

This starts a local PostgreSQL container named `restaurant-locator-db`.

If you want to confirm the container is running:

```bash
docker ps
```

You should see `restaurant-locator-db` in the output.

## 6. Seed the database

```bash
npm run seed
```

What this command does:

- connects to PostgreSQL
- creates the schema if needed through TypeORM
- reads restaurant data from `data/locations_big.json`
- validates the input records
- maps the JSON fields into the database entity format
- upserts the data in batches

If PostgreSQL has only just started and the seed command fails immediately, wait a few seconds and run `npm run seed` again.

## 7. Check that the data was loaded

One quick way to verify the seed worked is to query the database from inside the container:

```bash
docker exec -it restaurant-locator-db psql -U postgres -d restaurant_locator -c "SELECT COUNT(*) FROM locations;"
```

If the seed succeeded, this should return a count greater than `0`.

You can also run a quick sample query:

```bash
docker exec -it restaurant-locator-db psql -U postgres -d restaurant_locator -c "SELECT id, name, x, y, radius FROM locations LIMIT 5;"
```

## 8. Run the API

For development:

```bash
npm run dev
```

For a production-style run:

```bash
npm run build
npm start
```

Once the API is running, open:

```text
http://localhost:3000/docs
```

That Swagger page is the fastest way to explore and manually test the endpoints.

If helpful, a Postman collection can be added later, but Swagger should be enough to get started quickly.

## 9. Run the tests

```bash
npm test
```

The test suite includes:

- API integration tests
- service-level unit tests
- global error-handler tests

Note: the integration tests expect PostgreSQL to be running locally.

## Seed Script

The seed script lives at:

```text
scripts/seed-locations.ts
```

At the moment it reads from:

```text
data/locations_big.json
```

If needed, that input path can be changed easily.

## Project Structure

High-level structure:

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

Here is a simple summary of the main choices in this project:

| Choice | Why I used it |
|---|---|
| `Fastify` | It is small, fast, and easy to work with for building APIs. |
| `TypeScript` | It helps catch mistakes earlier and makes the code easier to follow. |
| `PostgreSQL` | The challenge mentions bigger datasets, so a real database is a safer choice than keeping everything only in memory. |
| `TypeORM` | Used for the entity model, repository access, and query building. |
| `Swagger` | Generated from the Fastify route schemas so the docs stay close to the API. |
| `Mocha + Chai` | They are simple and lightweight for both API tests and unit tests. |

Here are a few choices I want to explain briefly:

- `Why PostgreSQL`: I wanted the search to work in a way that still makes sense if the dataset grows. PostgreSQL lets the API filter and sort data before it is returned.

- `Why database filtering and sorting`: Instead of loading every restaurant into the app and checking them one by one, the database does the heavy work. That keeps the API simpler and more scalable.

- `Why pagination`: Pagination is not required for the basic challenge, but it helps avoid returning very large responses at once. It is a small addition that makes the search endpoint more practical.

- `Why a seed script`: The challenge provides restaurant data in JSON. The seed script gives a repeatable way to load that data into PostgreSQL, validate it, and re-run the setup quickly.

- `Why validation and clear errors`: I wanted invalid requests to fail in a predictable way. That makes the API easier to test, easier to debug, and nicer to use.

- `Why separate test types`: I kept API tests for end-to-end behavior and added unit tests for service and error-handling logic. This makes the tests easier to understand and helps cover both real request flows and edge cases.
