import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from '../../src/common/constants/api.constants';
import { createE2eApp } from '../create-e2e-app';
import { createUniqueRunId } from './integration-test-helpers';

describe('Phase 3 foundation app integration', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('echoes incoming request ID in response header and error body', async () => {
    const runId = createUniqueRunId('infra');
    const requestId = `${runId}-request`;

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/v1/projects')
      .set(REQUEST_ID_HEADER, requestId)
      .send({
        key: `${runId}-project`,
        name: 'Missing Actor Project',
      })
      .expect(400);

    expect(response.headers[RESPONSE_REQUEST_ID_HEADER.toLowerCase()]).toBe(
      requestId,
    );

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId,
    });
  });

  it('formats DTO validation errors with request ID', async () => {
    const runId = createUniqueRunId('infra');
    const requestId = `${runId}-request`;

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/v1/evaluate')
      .set(REQUEST_ID_HEADER, requestId)
      .send({
        projectKey: 'Invalid_Project_Key',
        flagKey: `${runId}-flag`,
        context: {},
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId,
    });

    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'projectKey',
        }),
      ]),
    );
  });

  it('returns HTTP 200 evaluation-shaped NOT_FOUND for missing project', async () => {
    const runId = createUniqueRunId('infra');
    const projectKey = `${runId}-missing-project`;
    const flagKey = `${runId}-flag`;

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey,
        context: {
          targetingKey: `${runId}-user`,
          userId: `${runId}-user`,
          roles: ['beta-tester'],
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      projectKey,
      flagKey,
      enabled: false,
      variant: 'off',
      reason: 'NOT_FOUND',
      matchedRuleId: null,
    });
  });
});
