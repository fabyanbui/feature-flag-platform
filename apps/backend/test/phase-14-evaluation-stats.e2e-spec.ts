import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { cleanDatabase } from './database-test-utils';
import { createE2eApp } from './create-e2e-app';

describe('Phase 14 evaluation statistics routes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('returns NOT_FOUND for statistics of a missing project', async () => {
    const missingProjectKey = `missing-stats-${Date.now()}`;

    await request(app.getHttpServer())
      .get(`/v1/projects/${missingProjectKey}/stats/flags`)
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'NOT_FOUND',
        });
      });
  });

  it('validates statistics query parameters', async () => {
    await request(app.getHttpServer())
      .get('/v1/projects/demo-project/stats/flags')
      .query({
        environmentKey: 'Invalid_Environment',
        limit: 101,
        sort: 'createdAt',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'VALIDATION_ERROR',
        });
      });
  });
});
