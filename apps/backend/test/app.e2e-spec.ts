import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-e2e-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpAdapter().getInstance())
      .get('/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'feature-flag-backend',
      });
  });
});
