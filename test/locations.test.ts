import 'reflect-metadata';
import { expect } from 'chai';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { AppDataSource } from '../src/db/data-source';
import { LocationEntity } from '../src/db/entities/locations/locations.entity';

describe('Restaurant Locator API', function () {
  let app: FastifyInstance;

  before(async function () {
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(LocationEntity);

    await repo.clear();

    await repo.save([
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mantra Restaurant',
    x: 2,
    y: 2,
    radius: 2,
    type: 'Restaurant',
    image: 'https://tinyurl.com',
    openingHours: '10:00AM-10:00PM',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Goji',
    x: 3,
    y: 3,
    radius: 3,
    type: 'Restaurant',
    image: 'https://tinyurl.com',
    openingHours: '10:00AM-11:00PM',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Third Place',
    x: 4,
    y: 4,
    radius: 1,
    type: 'Restaurant',
    image: 'https://tinyurl.com',
    openingHours: '10:00AM-9:00PM',
  },
]);

    app = buildApp();
    await app.ready();
  });

  after(async function () {
    const repo = AppDataSource.getRepository(LocationEntity);
    await repo.clear();

    await app.close();
    await AppDataSource.destroy();
  });

  describe('GET /health', function () {
  it('should return health status', async function () {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).to.equal(200);
    expect(response.json()).to.deep.equal({ status: 'ok' });
  });
});

describe('GET /locations/search', function () {
  it('should return visible locations sorted by distance', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body['user-location']).to.equal('x=2,y=2');
  expect(body.page).to.equal(1);
  expect(body.limit).to.equal(10);
  expect(body.total).to.equal(2);

  expect(body.locations).to.be.an('array').with.lengthOf(2);

  expect(body.locations[0]).to.deep.equal({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mantra Restaurant',
    coordinates: 'x=2,y=2',
    distance: 0,
  });

  expect(body.locations[1]).to.deep.equal({
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Goji',
    coordinates: 'x=3,y=3',
    distance: 1.41421,
  });

  expect(body.locations[0].distance).to.be.at.most(body.locations[1].distance);
});

it('should return an empty list when no locations are visible', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=0&y=0',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body['user-location']).to.equal('x=0,y=0');
  expect(body.page).to.equal(1);
  expect(body.limit).to.equal(10);
  expect(body.total).to.equal(0);
  expect(body.locations).to.deep.equal([]);
});

it('should include a location when distance is exactly equal to radius', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=0',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body['user-location']).to.equal('x=2,y=0');
  expect(body.total).to.equal(1);
  expect(body.locations).to.have.lengthOf(1);

  expect(body.locations[0]).to.deep.equal({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mantra Restaurant',
    coordinates: 'x=2,y=2',
    distance: 2,
  });
});

it('should paginate search results for page 1', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2&page=1&limit=1',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body.page).to.equal(1);
  expect(body.limit).to.equal(1);
  expect(body.total).to.equal(2);
  expect(body.locations).to.have.lengthOf(1);

  expect(body.locations[0]).to.deep.equal({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mantra Restaurant',
    coordinates: 'x=2,y=2',
    distance: 0,
  });
});

it('should paginate search results for page 2', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2&page=2&limit=1',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body.page).to.equal(2);
  expect(body.limit).to.equal(1);
  expect(body.total).to.equal(2);
  expect(body.locations).to.have.lengthOf(1);

  expect(body.locations[0]).to.deep.equal({
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Goji',
    coordinates: 'x=3,y=3',
    distance: 1.41421,
  });
});

it('should exclude locations outside radius', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2',
  });

  const body = response.json();

  const ids = body.locations.map((l: any) => l.id);

  expect(ids).to.not.include('33333333-3333-3333-3333-333333333333');
});

it('should include third location when user is near it', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=4&y=4',
  });

  const body = response.json();

  expect(body.total).to.equal(2);

  expect(body.locations[0].name).to.equal('Third Place');
});

it('should return 400 when x is missing', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?y=2',
  });

  expect(response.statusCode).to.equal(400);
});

it('should return 400 when y is missing', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2',
  });

  expect(response.statusCode).to.equal(400);
});

it('should return 400 for negative x', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=-1&y=2',
  });

  expect(response.statusCode).to.equal(400);
});

it('should return 400 for non-numeric x', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=abc&y=2',
  });

  expect(response.statusCode).to.equal(400);

  const body = response.json();
  expect(body.errorType).to.equal('Bad Request');
});

it('should return 400 for non-numeric y', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=abc',
  });

  expect(response.statusCode).to.equal(400);

  const body = response.json();
  expect(body.errorType).to.equal('Bad Request');
});

it('should return 400 when page is 0', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2&page=0&limit=1',
  });

  expect(response.statusCode).to.equal(400);

  const body = response.json();
  expect(body.errorType).to.equal('Bad Request');
});

it('should return 400 when limit is 0', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/search?x=2&y=2&page=1&limit=0',
  });

  expect(response.statusCode).to.equal(400);

  const body = response.json();
  expect(body.errorType).to.equal('Bad Request');
});
});
describe('GET /locations/:id', function () {
  it('should return location details by id', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/11111111-1111-1111-1111-111111111111',
  });

  expect(response.statusCode).to.equal(200);

  const body = response.json();

  expect(body).to.deep.equal({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mantra Restaurant',
    type: 'Restaurant',
    image: 'https://tinyurl.com',
    coordinates: 'x=2,y=2',
    'opening-hours': '10:00AM-10:00PM',
  });
});

it('should return 404 for a non-existent location id', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  });

  expect(response.statusCode).to.equal(404);

  const body = response.json();
  expect(body.errorType).to.equal('Not Found');
});

it('should return 400 for an invalid location id format', async function () {
  const response = await app.inject({
    method: 'GET',
    url: '/locations/123',
  });

  expect(response.statusCode).to.equal(400);

  const body = response.json();
  expect(body.errorType).to.equal('Bad Request');
});
});

});