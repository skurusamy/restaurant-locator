import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_INT_32, MAX_LIMIT } from '../../common/constants/constants';
import {
  badRequestResponseSchema,
  internalServerErrorResponseSchema,
  notFoundResponseSchema,
} from '../../common/schemas/error.schema';

export const searchLocationsSchema = {
  summary: 'Search visible restaurant locations',
  description:
    'Returns locations visible from the given user coordinates, sorted by distance ascending.',
  querystring: {
    type: 'object',
    additionalProperties: false,
    required: ['x', 'y'],
    properties: {
      x: {
        type: 'integer',
        minimum: 0,
        examples: [2],
        description: 'User x coordinate',
        maximum: MAX_INT_32,
      },
      y: {
        type: 'integer',
        minimum: 0,
        examples: [2],
        description: 'User y coordinate',
        maximum: MAX_INT_32,
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: DEFAULT_PAGE,
        description: 'Page number for pagination',
        maximum: MAX_INT_32,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: MAX_LIMIT,
        default: DEFAULT_LIMIT,
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
          examples: ['x=2,y=2'],
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
                minLength: 1,
                examples: ['Mantra Restaurant'],
              },
              coordinates: {
                type: 'string',
                examples: ['x=2,y=2'],
              },
              distance: {
                type: 'number',
                examples: [1.0],
              },
            },
            required: ['id', 'name', 'coordinates', 'distance'],
          },
        },
        page: {
          type: 'integer',
          examples: [1],
        },
        limit: {
          type: 'integer',
          examples: [10],
        },
        total: {
          type: 'integer',
          examples: [2],
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
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Location id',
        examples: ['51e1545c-8b65-4d83-82f9-7fcad4a23111'],
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
          examples: ['51e1545c-8b65-4d83-82f9-7fcad4a23111'],
        },
        name: {
          type: 'string',
          minLength: 1,
          examples: ['Da Jia Le'],
        },
        type: {
          type: 'string',
          examples: ['Restaurant'],
        },
        image: {
          type: 'string',
          format: 'uri',
          examples: ['https://tinyurl.com'],
        },
        coordinates: {
          type: 'string',
          examples: ['x=5,y=5'],
        },
        'opening-hours': {
          type: 'string',
          examples: ['10:00AM-11:00PM'],
        },
      },
      required: ['id', 'name', 'coordinates'],
    },
    400: badRequestResponseSchema,
    404: notFoundResponseSchema,
    500: internalServerErrorResponseSchema,
  },
};

export const upsertLocationSchema = {
  summary: 'Create or update a restaurant location',
  description: 'Creates a new location if it does not exist, or updates the existing one.',
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Location id',
        examples: ['51e1545c-8b65-4d83-82f9-7fcad4a23111'],
      },
    },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name', 'coordinates', 'radius'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        examples: ['51e1545c-8b65-4d83-82f9-7fcad4a23111'],
      },
      name: {
        type: 'string',
        minLength: 1,
        examples: ['Da Jia Le'],
      },
      type: {
        type: 'string',
        examples: ['Restaurant'],
      },
      image: {
        type: 'string',
        format: 'uri',
        examples: ['https://tinyurl.com'],
      },
      'opening-hours': {
        type: 'string',
        examples: ['10:00AM-11:00PM'],
      },
      coordinates: {
        type: 'string',
        pattern: '^x=\\d+,y=\\d+$',
        examples: ['x=5,y=5'],
      },
      radius: {
        type: 'integer',
        minimum: 1,
        examples: [1],
        maximum: MAX_INT_32,
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
          minLength: 1,
          examples: ['Da Jia Le'],
        },
        type: {
          type: 'string',
          examples: ['Restaurant'],
        },
        image: {
          type: 'string',
          format: 'uri',
          examples: ['https://tinyurl.com'],
        },
        coordinates: {
          type: 'string',
          examples: ['x=5,y=5'],
        },
        radius: {
          type: 'integer',
          minimum: 1,
          examples: [1],
        },
        'opening-hours': {
          type: 'string',
          examples: ['10:00AM-11:00PM'],
        },
      },
      required: ['id', 'name', 'coordinates', 'radius'],
    },
    400: badRequestResponseSchema,
    500: internalServerErrorResponseSchema,
  },
};
