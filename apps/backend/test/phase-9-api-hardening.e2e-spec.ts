import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-e2e-app';

describe('Phase 9 API hardening release readiness (e2e)', () => {
  let app: INestApplication<App>;
  let sequence = 0;

  const actor = 'phase9-api-admin';

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sequence += 1;
  });

  it('returns consistent validation error shape for invalid request bodies', async () => {
    const requestId = `req_phase9_validation_${sequence}`;

    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .set('X-Request-Id', requestId)
      .send({
        key: 'Invalid Project Key',
        name: 'Invalid Project',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      requestId,
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'key',
          message: expect.stringContaining('must be 3-64 characters'),
        }),
      ]),
    );
  });

  it('returns paginated list responses with items and page metadata', async () => {
    const projectKey = `phase9-api-page-${Date.now()}-${sequence}`;

    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Phase 9 Pagination Project',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/projects')
      .query({
        limit: 1,
        offset: 0,
        sort: 'key',
        order: 'asc',
      })
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('page');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeLessThanOrEqual(1);
    expect(response.body.page).toEqual({
      limit: 1,
      offset: 0,
      total: expect.any(Number),
      hasNext: expect.any(Boolean),
    });
  });

  it('returns conflict error shape for duplicate project keys', async () => {
    const projectKey = `phase9-api-conflict-${Date.now()}-${sequence}`;
    const requestId = `req_phase9_conflict_${sequence}`;

    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Phase 9 Conflict Project',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .set('X-Request-Id', requestId)
      .send({
        key: projectKey,
        name: 'Duplicate Phase 9 Conflict Project',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      code: 'CONFLICT',
      message: `Project "${projectKey}" already exists.`,
      requestId,
    });
  });

  it('rejects mutation requests without X-Actor so changes stay auditable', async () => {
    const projectKey = `phase9-api-actor-${Date.now()}-${sequence}`;
    const requestId = `req_phase9_actor_${sequence}`;

    const response = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Request-Id', requestId)
      .send({
        key: projectKey,
        name: 'Missing Actor Project',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'X-Actor header is required for mutation requests.',
      requestId,
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'X-Actor',
        }),
      ]),
    );
  });

  it('rejects unsupported sort fields with validation details', async () => {
    const requestId = `req_phase9_sort_${sequence}`;

    const response = await request(app.getHttpServer())
      .get('/v1/projects')
      .set('X-Request-Id', requestId)
      .query({
        sort: 'unsupported',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Unsupported project sort field.',
      requestId,
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'sort',
          message: expect.stringContaining('Allowed values'),
        }),
      ]),
    );
  });

  it('returns not-found error shape for missing management resources', async () => {
    const missingProjectKey = `phase9-api-missing-${Date.now()}-${sequence}`;
    const requestId = `req_phase9_missing_${sequence}`;

    const response = await request(app.getHttpServer())
      .get(`/v1/projects/${missingProjectKey}`)
      .set('X-Request-Id', requestId)
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      message: `Project "${missingProjectKey}" was not found.`,
      requestId,
    });
  });
});
