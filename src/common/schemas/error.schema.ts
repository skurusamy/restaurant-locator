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