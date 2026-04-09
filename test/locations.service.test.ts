import { expect } from 'chai';
import { LocationsRepository } from '../src/locations/repositories/locations.repository';
import { LocationsService } from '../src/locations/services/locations.service';

describe('LocationsService', function () {
  it('should clamp page to 1 and limit to 50 when searching by distance', async function () {
    let capturedPage: number | undefined;
    let capturedLimit: number | undefined;

    const repositoryStub = {
      searchByDistance: async (_userX: number, _userY: number, page: number, limit: number) => {
        capturedPage = page;
        capturedLimit = limit;

        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              name: 'Mantra Restaurant',
              x: 2,
              y: 2,
              distance: 0,
            },
          ],
          total: 1,
        };
      },
    } as unknown as LocationsRepository;

    const service = new LocationsService(repositoryStub);

    const result = await service.searchByDistance(2, 2, 0, 51);

    expect(capturedPage).to.equal(1);
    expect(capturedLimit).to.equal(50);
    expect(result.page).to.equal(1);
    expect(result.limit).to.equal(50);
    expect(result.locations).to.deep.equal([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mantra Restaurant',
        coordinates: 'x=2,y=2',
        distance: 0,
      },
    ]);
  });

  it('should throw 400 when path id and body id do not match', async function () {
    const repositoryStub = {} as LocationsRepository;
    const service = new LocationsService(repositoryStub);

    const payload = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Mismatch Place',
      type: 'Restaurant',
      image: 'https://tinyurl.com',
      'opening-hours': '9:00AM-10:00PM',
      coordinates: 'x=5,y=6',
      radius: 3,
    };

    try {
      await service.upsertLocation('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', payload);
      expect.fail('Expected upsertLocation to throw.');
    } catch (error: any) {
      expect(error.statusCode).to.equal(400);
      expect(error.message).to.equal('Path id must match body id.');
    }
  });

  it('should throw 500 when upsert succeeds but the saved location cannot be re-read', async function () {
    const repositoryStub = {
      upsert: async () => undefined,
      findById: async () => null,
    } as unknown as LocationsRepository;

    const service = new LocationsService(repositoryStub);

    const payload = {
      id: 'abababab-abab-abab-abab-abababababab',
      name: 'Retry Place',
      type: 'Restaurant',
      image: 'https://tinyurl.com',
      'opening-hours': '9:00AM-10:00PM',
      coordinates: 'x=5,y=6',
      radius: 3,
    };

    try {
      await service.upsertLocation(payload.id, payload);
      expect.fail('Expected upsertLocation to throw.');
    } catch (error: any) {
      expect(error.statusCode).to.equal(500);
      expect(error.message).to.equal('Failed to persist location.');
    }
  });
});
