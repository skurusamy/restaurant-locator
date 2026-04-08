export const errorResponseSchema = {
  type: 'object',
  properties: {
    errorType: {
      type: 'string',
      example: 'Bad Request',
    },
    message: {
      type: 'string',
      example: 'Invalid request',
    },
  },
  required: ['message'],
};

export function createErrorResponseSchema(errorType: string, message: string) {
  return {
    ...errorResponseSchema,
    properties: {
      ...errorResponseSchema.properties,
      errorType: {
        type: 'string',
        example: errorType,
      },
      message: {
        type: 'string',
        example: message,
      },
    },
  };
}

export const badRequestResponseSchema = createErrorResponseSchema(
  'Bad Request',
  'Invalid request'
);

export const notFoundResponseSchema = createErrorResponseSchema(
  'Not Found',
  'Location not found.'
);

export const internalServerErrorResponseSchema = createErrorResponseSchema(
  'Internal Server Error',
  'An unexpected error occurred'
);
