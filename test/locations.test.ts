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

      expect(body.locations[0].distance).to.be.at.most(
        body.locations[1].distance
      );
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

    it('should return 400 when limit is greater than 50', async function () {
      const response = await app.inject({
        method: 'GET',
        url: '/locations/search?x=2&y=2&page=1&limit=51',
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

  describe('PUT /locations/:id', function () {
    it('should create a new location', async function () {
      const payload = {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'New Place',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 4,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/44444444-4444-4444-4444-444444444444',
        payload,
      });

      expect(response.statusCode).to.equal(200);

      const body = response.json();

      expect(body).to.deep.equal({
        id: '44444444-4444-4444-4444-444444444444',
        name: 'New Place',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        coordinates: 'x=5,y=6',
        radius: 4,
        'opening-hours': '9:00AM-10:00PM',
      });

      const getResponse = await app.inject({
        method: 'GET',
        url: '/locations/44444444-4444-4444-4444-444444444444',
      });

      expect(getResponse.statusCode).to.equal(200);
      expect(getResponse.json().name).to.equal('New Place');
    });

    it('should update an existing location', async function () {
      const payload = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mantra Restaurant Updated',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '11:00AM-11:00PM',
        coordinates: 'x=2,y=2',
        radius: 5,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/11111111-1111-1111-1111-111111111111',
        payload,
      });

      expect(response.statusCode).to.equal(200);

      const body = response.json();

      expect(body).to.deep.equal({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mantra Restaurant Updated',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        coordinates: 'x=2,y=2',
        radius: 5,
        'opening-hours': '11:00AM-11:00PM',
      });

      const getResponse = await app.inject({
        method: 'GET',
        url: '/locations/11111111-1111-1111-1111-111111111111',
      });

      expect(getResponse.statusCode).to.equal(200);
      expect(getResponse.json().name).to.equal('Mantra Restaurant Updated');
    });

    it('should return 400 when path id and body id do not match', async function () {
      const payload = {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Mismatch Place',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=5',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/44444444-4444-4444-4444-444444444444',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 for invalid coordinates format', async function () {
      const payload = {
        id: '66666666-6666-6666-6666-666666666666',
        name: 'Bad Coordinates',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: '5,6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/66666666-6666-6666-6666-666666666666',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 for negative coordinates', async function () {
      const payload = {
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Negative Coordinates',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=-1,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/77777777-7777-7777-7777-777777777777',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 for decimal coordinates', async function () {
      const payload = {
        id: '78777777-7777-7777-7777-777777777777',
        name: 'Decimal Coordinates',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=1.5,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/78777777-7777-7777-7777-777777777777',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 for invalid path id format', async function () {
      const payload = {
        id: '88888888-8888-8888-8888-888888888888',
        name: 'Invalid Path UUID',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/123',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 when radius is 0', async function () {
      const payload = {
        id: '99999999-9999-9999-9999-999999999999',
        name: 'Bad Radius',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 0,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/99999999-9999-9999-9999-999999999999',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 when a required body field is missing', async function () {
      const payload = {
        id: '12121212-1212-1212-1212-121212121212',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/12121212-1212-1212-1212-121212121212',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 when name is an empty string', async function () {
      const payload = {
        id: '13131313-1313-1313-1313-131313131313',
        name: '',
        type: 'Restaurant',
        image: 'https://tinyurl.com',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/13131313-1313-1313-1313-131313131313',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 when image is not a valid URI', async function () {
      const payload = {
        id: '14141414-1414-1414-1414-141414141414',
        name: 'Bad Image',
        type: 'Restaurant',
        image: 'not-a-valid-uri',
        'opening-hours': '9:00AM-10:00PM',
        coordinates: 'x=5,y=6',
        radius: 3,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/14141414-1414-1414-1414-141414141414',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
    });

    it('should return 400 when coordinates exceed the supported integer range', async function () {
      const payload = {
        id: 'e6a1c53a-96b7-45ad-942d-bc684ee7a78f',
        name: 'Test Restaurant 1',
        type: 'Cafe',
        image: 'https://picsum.photos/200/200?random=1',
        coordinates: 'x=100000000000000000,y=50000000000000000',
        radius: 11,
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/locations/e6a1c53a-96b7-45ad-942d-bc684ee7a78f',
        payload,
      });

      expect(response.statusCode).to.equal(400);

      const body = response.json();
      expect(body.errorType).to.equal('Bad Request');
      expect(body.message).to.equal('Coordinates must contain valid non-negative integer x and y values.');
    });
  });
});
