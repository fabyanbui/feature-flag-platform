import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { createE2eApp } from './create-e2e-app';
import { cleanDatabase } from './database-test-utils';
import { bearer, RBAC_TEST_CREDENTIALS } from './rbac-test-credentials';

describe('Phase 16 server-resolved demo RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;
  let projectKey: string;
  let flagKey: string;
  let groupKey: string;

  const admin = bearer(RBAC_TEST_CREDENTIALS.admin.token);
  const developer = bearer(RBAC_TEST_CREDENTIALS.developer.token);
  const viewer = bearer(RBAC_TEST_CREDENTIALS.viewer.token);

  beforeAll(async () => {
    app = await createE2eApp({ defaultAuthorization: false });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    sequence += 1;
    projectKey = `phase16-${Date.now()}-${sequence}`;
    flagKey = `rbac-flag-${sequence}`;
    groupKey = `rbac-group-${sequence}`;

    await cleanDatabase(prisma);
    await createProject(projectKey);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('returns UNAUTHORIZED for missing, malformed, and invalid credentials', async () => {
    for (const authorization of [
      undefined,
      'Basic invalid',
      'Bearer invalid-token',
    ]) {
      const call = request(app.getHttpServer()).get('/v1/projects');
      if (authorization) {
        call.set('Authorization', authorization);
      }

      const response = await call.expect(401);
      expect(response.body).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Valid demo credentials are required.',
      });
      expect(response.body.requestId).toEqual(expect.stringMatching(/^req_/));
    }
  });

  it('allows viewers to read every control-plane reporting surface', async () => {
    await createFlag(flagKey, admin);

    await request(app.getHttpServer())
      .get('/v1/projects')
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags`)
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/groups`)
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/flags/${flagKey}/history`)
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/audit-logs`)
      .set('Authorization', viewer)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/stats/flags`)
      .set('Authorization', viewer)
      .expect(200);
  });

  it('keeps viewers read only even when actor and role headers are spoofed', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('Authorization', viewer)
      .set('X-Actor', RBAC_TEST_CREDENTIALS.admin.actor)
      .set('X-Actor-Role', 'ADMIN')
      .send({ key: flagKey, name: 'Viewer should not create this' })
      .expect(403);

    expect(response.body).toMatchObject({
      code: 'FORBIDDEN',
      message: 'The selected demo identity does not have permission.',
    });
    await expect(
      prisma.featureFlag.count({ where: { key: flagKey } }),
    ).resolves.toBe(0);
  });

  it('allows developer flag workflows but blocks administrative safety controls', async () => {
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('Authorization', admin)
      .send({ key: groupKey, name: 'RBAC group' })
      .expect(201);

    await createFlag(flagKey, developer);

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('Authorization', developer)
      .send({
        name: 'Developer-managed flag',
        status: 'ENABLED',
        servingMode: 'TARGETED',
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('Authorization', developer)
      .send({
        rules: [
          {
            type: 'ROLE_TARGETING',
            priority: 10,
            enabled: true,
            parameters: { roles: ['beta-tester'] },
          },
        ],
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/group`)
      .set('Authorization', developer)
      .send({ groupKey })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('Authorization', developer)
      .send({ key: `forbidden-${sequence}`, name: 'Forbidden project' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('Authorization', developer)
      .send({ key: `forbidden-group-${sequence}`, name: 'Forbidden group' })
      .expect(403);
    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/groups/${groupKey}/config`)
      .set('Authorization', developer)
      .send({ environmentKey: 'production', killSwitch: true })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/archive`)
      .set('Authorization', developer)
      .expect(403);
  });

  it('allows administrators to manage lifecycle, groups, kill switches, and sample users', async () => {
    await createFlag(flagKey, admin);

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/groups`)
      .set('Authorization', admin)
      .send({ key: groupKey, name: 'Admin group' })
      .expect(201);
    await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/groups/${groupKey}/config`)
      .set('Authorization', admin)
      .send({ environmentKey: 'production', killSwitch: true })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/archive`)
      .set('Authorization', admin)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags/${flagKey}/restore`)
      .set('Authorization', admin)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/sample-users`)
      .set('Authorization', admin)
      .send({
        targetingKey: `phase16-user-${sequence}`,
        displayName: 'Phase 16 user',
        roles: ['beta-tester'],
        attributes: {},
      })
      .expect(201);
  });

  it('uses the resolved actor for audits and never the spoofed client actor', async () => {
    const requestId = `req_phase16_actor_${sequence}`;

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('Authorization', developer)
      .set('X-Actor', 'spoofed-admin')
      .set('X-Actor-Role', 'ADMIN')
      .set('X-Request-Id', requestId)
      .send({ key: flagKey, name: 'Audited developer flag' })
      .expect(201);

    const audit = await prisma.auditLogEntry.findFirstOrThrow({
      where: {
        projectKey,
        targetKey: flagKey,
        action: 'FEATURE_FLAG_CREATED',
      },
    });

    expect(audit.actor).toBe(RBAC_TEST_CREDENTIALS.developer.actor);
    expect(audit.actor).not.toBe('spoofed-admin');
    expect(audit.requestId).toBe(requestId);
  });

  it('keeps the evaluation data plane public and contract-compatible', async () => {
    await createFlag(flagKey, admin);
    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('Authorization', developer)
      .send({ status: 'ENABLED', servingMode: 'GLOBAL_ON' })
      .expect(200);

    const body = {
      projectKey,
      flagKey,
      context: { targetingKey: `phase16-target-${sequence}` },
    };

    const publicResponse = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send(body)
      .expect(200);
    const credentialedResponse = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .set('Authorization', viewer)
      .send(body)
      .expect(200);

    expect(publicResponse.body).toMatchObject({
      projectKey,
      flagKey,
      enabled: true,
      reason: 'GLOBAL_ON',
    });
    expect(credentialedResponse.body).toEqual(publicResponse.body);
  });

  async function createProject(key: string) {
    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('Authorization', admin)
      .send({ key, name: 'Phase 16 project' })
      .expect(201);
  }

  async function createFlag(key: string, authorization: string) {
    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('Authorization', authorization)
      .send({ key, name: 'Phase 16 flag' })
      .expect(201);
  }
});
