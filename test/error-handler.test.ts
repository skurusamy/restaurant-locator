import { expect } from 'chai';
import Fastify from 'fastify';
import { registerGlobalErrorHandler } from '../src/common/errors/error-handler';

describe('Global Error Handler', function () {
  it('should format required-field validation errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/required', async () => {
      throw {
        statusCode: 400,
        validationContext: 'body',
        validation: [
          {
            keyword: 'required',
            instancePath: '',
            params: { missingProperty: 'name' },
          },
        ],
      };
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/required',
    });

    expect(response.statusCode).to.equal(400);
    expect(response.json()).to.deep.equal({
      errorType: 'Bad Request',
      message: "Request body field 'name' is required.",
    });

    await app.close();
  });

  it('should format invalid UUID errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/uuid', async () => {
      throw {
        statusCode: 400,
        validationContext: 'params',
        validation: [
          {
            keyword: 'format',
            instancePath: '/id',
            params: { format: 'uuid' },
          },
        ],
      };
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/uuid',
    });

    expect(response.statusCode).to.equal(400);
    expect(response.json()).to.deep.equal({
      errorType: 'Bad Request',
      message: "Path parameter 'id' must be a valid UUID.",
    });

    await app.close();
  });

  it('should format minimum validation errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/minimum', async () => {
      throw {
        statusCode: 400,
        validationContext: 'querystring',
        validation: [
          {
            keyword: 'minimum',
            instancePath: '/limit',
            params: { limit: 1 },
          },
        ],
      };
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/minimum',
    });

    expect(response.statusCode).to.equal(400);
    expect(response.json()).to.deep.equal({
      errorType: 'Bad Request',
      message: "Query parameter 'limit' must be at least 1.",
    });

    await app.close();
  });

  it('should format minLength validation errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/min-length', async () => {
      throw {
        statusCode: 400,
        validationContext: 'body',
        validation: [
          {
            keyword: 'minLength',
            instancePath: '/name',
            params: { limit: 1 },
          },
        ],
      };
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/min-length',
    });

    expect(response.statusCode).to.equal(400);
    expect(response.json()).to.deep.equal({
      errorType: 'Bad Request',
      message: "Request body field 'name' must not be empty.",
    });

    await app.close();
  });

  it('should format coordinates pattern validation errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/pattern', async () => {
      throw {
        statusCode: 400,
        validationContext: 'body',
        validation: [
          {
            keyword: 'pattern',
            instancePath: '/coordinates',
            params: { pattern: '^x=-?\\d+,y=-?\\d+$' },
          },
        ],
      };
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/pattern',
    });

    expect(response.statusCode).to.equal(400);
    expect(response.json()).to.deep.equal({
      errorType: 'Bad Request',
      message: `Request body field 'coordinates' must be in the format "x=<non-negative integer>,y=<non-negative integer>".`,
    });

    await app.close();
  });

  it('should return a generic message for 500 errors', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/server-error', async () => {
      throw new Error('Something broke');
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/server-error',
    });

    expect(response.statusCode).to.equal(500);
    expect(response.json()).to.deep.equal({
      errorType: 'Internal Server Error',
      message: 'Internal Server Error',
    });

    await app.close();
  });

  it('should fall back to a default message when an internal error message is empty', async function () {
    const app = Fastify({ logger: false });
    registerGlobalErrorHandler(app);

    app.get('/empty-error', async () => {
      throw new Error('');
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/empty-error',
    });

    expect(response.statusCode).to.equal(500);
    expect(response.json()).to.deep.equal({
      errorType: 'Internal Server Error',
      message: 'Internal Server Error',
    });

    await app.close();
  });
});
