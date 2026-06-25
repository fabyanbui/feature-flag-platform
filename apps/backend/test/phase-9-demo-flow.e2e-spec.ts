import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getStableRolloutBucketPercentage } from '../src/evaluation/engine/stable-rollout-hash';
import { createE2eApp } from './create-e2e-app';

describe('Phase 9 demo flow release readiness (e2e)', () => {
  let app: INestApplication<App>;

  const actor = 'demo-admin';
  const projectKey = `phase9-demo-${Date.now()}`;
  const globalFlagKey = 'beta-dashboard';
  const targetedFlagKey = 'new-checkout';

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('proves the presentation demo scenarios through the evaluation API', async () => {
    const rolloutIncludedKey = findTargetingKeyForBucket(
      projectKey,
      targetedFlagKey,
      (bucket) => bucket < 50,
    );

    const rolloutExcludedKey = findTargetingKeyForBucket(
      projectKey,
      targetedFlagKey,
      (bucket) => bucket >= 50,
    );

    await request(app.getHttpServer())
      .post('/v1/projects')
      .set('X-Actor', actor)
      .send({
        key: projectKey,
        name: 'Phase 9 Demo Project',
        description: 'Release-readiness E2E project for demo scenarios.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .send({
        key: globalFlagKey,
        name: 'Beta Dashboard',
        description: 'Globally enabled presentation demo flag.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${globalFlagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
        servingMode: 'GLOBAL_ON',
        killSwitch: false,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/v1/projects/${projectKey}/flags`)
      .set('X-Actor', actor)
      .send({
        key: targetedFlagKey,
        name: 'New Checkout',
        description: 'Targeted rollout presentation demo flag.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/v1/projects/${projectKey}/flags/${targetedFlagKey}`)
      .set('X-Actor', actor)
      .send({
        status: 'ENABLED',
        servingMode: 'TARGETED',
        killSwitch: false,
      })
      .expect(200);

    const rulesResponse = await request(app.getHttpServer())
      .put(`/v1/projects/${projectKey}/flags/${targetedFlagKey}/rules`)
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
          {
            type: 'PERCENTAGE_ROLLOUT',
            priority: 20,
            enabled: true,
            parameters: {
              percentage: 50,
            },
          },
        ],
      })
      .expect(200);

    expect(rulesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'ROLE_TARGETING',
          priority: 10,
          enabled: true,
        }),
        expect.objectContaining({
          type: 'PERCENTAGE_ROLLOUT',
          priority: 20,
          enabled: true,
        }),
      ]),
    );

    await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey: globalFlagKey,
        context: {
          targetingKey: 'phase9-global-user',
          userId: 'phase9-global-user',
          roles: ['user'],
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey,
          flagKey: globalFlagKey,
          enabled: true,
          variant: 'on',
          reason: 'GLOBAL_ON',
          matchedRuleId: null,
        });
      });

    await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey: targetedFlagKey,
        context: {
          targetingKey: 'phase9-beta-user',
          userId: 'phase9-beta-user',
          roles: ['beta-tester'],
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey,
          flagKey: targetedFlagKey,
          enabled: true,
          variant: 'on',
          reason: 'ROLE_MATCH',
        });
        expect(body.matchedRuleId).toEqual(
          rulesResponse.body.find(
            (rule: { type: string }) => rule.type === 'ROLE_TARGETING',
          ).id,
        );
      });

    await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey: targetedFlagKey,
        context: {
          targetingKey: rolloutIncludedKey,
          userId: rolloutIncludedKey,
          roles: ['user'],
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey,
          flagKey: targetedFlagKey,
          enabled: true,
          variant: 'on',
          reason: 'PERCENTAGE_ROLLOUT',
        });
        expect(body.matchedRuleId).toEqual(
          rulesResponse.body.find(
            (rule: { type: string }) => rule.type === 'PERCENTAGE_ROLLOUT',
          ).id,
        );
      });

    await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey,
        flagKey: targetedFlagKey,
        context: {
          targetingKey: rolloutExcludedKey,
          userId: rolloutExcludedKey,
          roles: ['user'],
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey,
          flagKey: targetedFlagKey,
          enabled: false,
          variant: 'off',
          reason: 'DEFAULT_OFF',
          matchedRuleId: null,
        });
      });

    await request(app.getHttpServer())
      .post('/v1/evaluate')
      .send({
        projectKey: 'missing-project',
        flagKey: 'missing-flag',
        context: {
          targetingKey: 'phase9-missing-user',
          userId: 'phase9-missing-user',
          roles: ['user'],
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          projectKey: 'missing-project',
          flagKey: 'missing-flag',
          enabled: false,
          variant: 'off',
          reason: 'NOT_FOUND',
          matchedRuleId: null,
        });
      });

    const auditLogsResponse = await request(app.getHttpServer())
      .get(`/v1/projects/${projectKey}/audit-logs`)
      .query({
        actor,
        limit: 20,
        offset: 0,
      })
      .expect(200);

    expect(auditLogsResponse.body).toHaveProperty('items');
    expect(auditLogsResponse.body).toHaveProperty('page');

    const auditActions = auditLogsResponse.body.items.map(
      (entry: { action: string }) => entry.action,
    );

    expect(auditActions).toEqual(
      expect.arrayContaining([
        'PROJECT_CREATED',
        'FEATURE_FLAG_CREATED',
        'FEATURE_FLAG_UPDATED',
        'FLAG_RULES_REPLACED',
      ]),
    );
  });
});

function findTargetingKeyForBucket(
  projectKey: string,
  flagKey: string,
  predicate: (bucket: number) => boolean,
): string {
  for (let index = 0; index < 1000; index += 1) {
    const targetingKey = `phase9-rollout-${index}`;
    const bucket = getStableRolloutBucketPercentage({
      projectKey,
      flagKey,
      targetingKey,
    });

    if (predicate(bucket)) {
      return targetingKey;
    }
  }

  throw new Error('Could not find deterministic rollout key for test.');
}
