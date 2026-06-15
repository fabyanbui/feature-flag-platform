import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-e2e-app';

describe('Phase 6 vertical slice (e2e)', () => {
  let app: INestApplication<App>;

  const actor = 'phase6-demo-admin';
  const projectKey = `phase6-demo-${Date.now()}`;
  const flagKey = 'new-checkout';

  const betaUserContext = {
    targetingKey: 'demo-user-beta',
    userId: 'demo-user-beta',
    roles: ['beta-tester'],
  };

  const regularUserContext = {
    targetingKey: 'demo-user-regular',
    userId: 'demo-user-regular',
    roles: ['user'],
  };

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, configures, and evaluates a demo feature flag', async () => {
    const projectResponse = await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Phase 6 Demo Project',
        description: 'Vertical slice project for Phase 6.',
      })
      .expect(201);

    expect(projectResponse.body).toMatchObject({
      key: projectKey,
      name: 'Phase 6 Demo Project',
      description: 'Vertical slice project for Phase 6.',
    });

    const flagResponse = await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .send({
        key: flagKey,
        name: 'New Checkout',
        description: 'Controls the new checkout experience.',
      })
      .expect(201);

    expect(flagResponse.body).toMatchObject({
      projectKey,
      key: flagKey,
      name: 'New Checkout',
      description: 'Controls the new checkout experience.',
      lifecycleStatus: 'ACTIVE',
      status: 'DISABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
      environmentKey: 'production',
    });

    const enabledFlagResponse = await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${flagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
        servingMode: 'TARGETED',
        killSwitch: false,
      })
      .expect(200);

    expect(enabledFlagResponse.body).toMatchObject({
      projectKey,
      key: flagKey,
      status: 'ENABLED',
      servingMode: 'TARGETED',
      killSwitch: false,
    });

    const rulesResponse = await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${flagKey}/rules`)
      .set('X-Actor', actor)
      .send({
        rules: [
          {
            type: 'ROLE_TARGETING',
            priority: 10,
            enabled: true,
            parameters: {
              roles: ['beta-tester'],
            },
          },
        ],
      })
      .expect(200);

    expect(rulesResponse.body).toHaveLength(1);
    expect(rulesResponse.body[0]).toMatchObject({
      type: 'ROLE_TARGETING',
      priority: 10,
      enabled: true,
      parameters: {
        roles: ['beta-tester'],
      },
    });

    const betaEvaluationResponse = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey,
        context: betaUserContext,
      })
      .expect(200);

    expect(betaEvaluationResponse.body).toMatchObject({
      projectKey,
      flagKey,
      enabled: true,
      variant: 'on',
      reason: 'ROLE_MATCH',
    });
    expect(betaEvaluationResponse.body.matchedRuleId).toEqual(
      rulesResponse.body[0].id,
    );

    const regularEvaluationResponse = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey,
        context: regularUserContext,
      })
      .expect(200);

    expect(regularEvaluationResponse.body).toMatchObject({
      projectKey,
      flagKey,
      enabled: false,
      variant: 'off',
      reason: 'DEFAULT_OFF',
      matchedRuleId: null,
    });
  });
});
