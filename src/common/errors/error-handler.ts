import { FastifyInstance } from 'fastify';

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSourceLabel(validationContext?: string): string {
  switch (validationContext) {
    case 'querystring':
      return 'Query parameter';
    case 'params':
      return 'Path parameter';
    case 'body':
      return 'Request body field';
    default:
      return 'Request field';
  }
}

function extractFieldName(instancePath: string | undefined, missingProperty: string | undefined): string | null {
  if (missingProperty) {
    return missingProperty;
  }

  if (!instancePath) {
    return null;
  }

  const segments = instancePath.split('/').filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : null;
}

function formatValidationMessage(error: any): string {
  const validationError = Array.isArray(error.validation)
    ? error.validation[0]
    : undefined;

  if (!validationError) {
    return error instanceof Error ? error.message : 'Invalid request';
  }

  const fieldName = extractFieldName(
    validationError.instancePath,
    validationError.params?.missingProperty
  );
  const sourceLabel = getSourceLabel(error.validationContext);
  const fieldLabel = fieldName ? `${sourceLabel} '${fieldName}'` : sourceLabel;

  switch (validationError.keyword) {
    case 'required':
      return `${fieldLabel} is required.`;
    case 'minimum':
      return `${fieldLabel} must be at least ${validationError.params?.limit}.`;
    case 'maximum':
      return `${fieldLabel} must be at most ${validationError.params?.limit}.`;
    case 'format':
      if (validationError.params?.format === 'uuid') {
        return `${fieldLabel} must be a valid UUID.`;
      }
      return `${fieldLabel} has an invalid format.`;
    case 'type':
      return `${fieldLabel} must be a ${validationError.params?.type}.`;
    default:
      return `${toTitleCase(sourceLabel)} is invalid.`;
  }
}

export function registerGlobalErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    const statusCode =
      typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof (error as any).statusCode === 'number'
        ? (error as any).statusCode
        : 500;

    const message =
      statusCode === 400
        ? formatValidationMessage(error)
        : error instanceof Error
          ? error.message
          : 'Internal Server Error';

    const errorType =
      statusCode === 400
        ? 'Bad Request'
        : statusCode === 404
          ? 'Not Found'
          : 'Internal Server Error';

    reply.status(statusCode).send({
      errorType,
      message,
    });
  });
}