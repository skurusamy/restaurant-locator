import {
  badRequestResponseSchema,
  internalServerErrorResponseSchema,
  notFoundResponseSchema,
} from '../common/schemas/error.schema';

export const searchLocationsSchema = {
  summary: 'Search visible restaurant locations',
  description:
    'Returns locations visible from the given user coordinates, sorted by distance ascending.',
  querystring: {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: {
        type: 'integer',
        minimum: 0,
        description: 'User x coordinate',
      },
      y: {
        type: 'integer',
        minimum: 0,
        description: 'User y coordinate',
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 10,
        description: 'Number of items per page',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        'user-location': {
          type: 'string',
          example: 'x=3,y=2',
        },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              name: {
                type: 'string',
              },
              coordinates: {
                type: 'string',
                example: 'x=2,y=2',
              },
              distance: {
                type: 'number',
                example: 1.0,
              },
            },
            required: ['id', 'name', 'coordinates', 'distance'],
          },
        },
        page: {
          type: 'integer',
          example: 1,
        },
        limit: {
          type: 'integer',
          example: 10,
        },
        total: {
          type: 'integer',
          example: 2,
        },
      },
      required: ['user-location', 'locations', 'page', 'limit', 'total'],
    },
    400: badRequestResponseSchema,
    500: internalServerErrorResponseSchema,
  },
};

export const getLocationByIdSchema = {
  summary: 'Get restaurant details by id',
  description: 'Returns detailed information for a specific location id.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Location id',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        image: {
          type: 'string',
        },
        coordinates: {
          type: 'string',
          example: 'x=5,y=5',
        },
        'opening-hours': {
          type: 'string',
          example: '10:00AM-11:00PM',
        },
      },
      required: ['id', 'name', 'coordinates'],
    },
    400: badRequestResponseSchema,
    404: notFoundResponseSchema,
    500: internalServerErrorResponseSchema,
  },
};
