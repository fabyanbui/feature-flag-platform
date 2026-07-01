import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config({ path: '../../.env' });
config({ path: '.env', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for Prisma seed.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createAuditIfMissing(
  id: string,
  data: Omit<Prisma.AuditLogEntryUncheckedCreateInput, 'id'>,
) {
  const existing = await prisma.auditLogEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    await prisma.auditLogEntry.create({
      data: {
        id,
        ...data,
      },
    });
  }
}

async function main() {
  // Phase 19 runs this seed automatically from Docker Compose. Keep it
  // non-destructive: create missing demo records, but never reset existing
  // demo edits, kill switches, lifecycle states, rules, or sample users.
  const project = await prisma.project.upsert({
    where: { key: 'demo-project' },
    update: {},
    create: {
      key: 'demo-project',
      name: 'Demo Project',
      description: 'Seed project for feature flag demos.',
    },
  });

  const production = await prisma.environment.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'production',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'production',
      name: 'Production',
      description: 'Default demo environment.',
      isDefault: true,
      sortOrder: 1,
    },
  });

  const staging = await prisma.environment.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'staging',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'staging',
      name: 'Staging',
      description: 'Pre-production testing environment.',
      isDefault: false,
      sortOrder: 2,
    },
  });

  const development = await prisma.environment.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'development',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'development',
      name: 'Development',
      description: 'Local development environment.',
      isDefault: false,
      sortOrder: 3,
    },
  });

  const customerExperienceGroup = await prisma.flagGroup.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'customer-experience',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'customer-experience',
      name: 'Customer Experience',
    },
  });

  const checkoutExperienceGroup = await prisma.flagGroup.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'checkout-experience',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'checkout-experience',
      name: 'Checkout Experience',
    },
  });

  const recommendationsGroup = await prisma.flagGroup.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'recommendations',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      key: 'recommendations',
      name: 'Recommendations',
    },
  });

  for (const group of [
    customerExperienceGroup,
    checkoutExperienceGroup,
    recommendationsGroup,
  ]) {
    for (const environment of [production, staging, development]) {
      await prisma.flagGroupConfig.upsert({
        where: {
          groupId_environmentId: {
            groupId: group.id,
            environmentId: environment.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          groupId: group.id,
          environmentId: environment.id,
          killSwitch: false,
        },
      });
    }
  }

  const betaDashboard = await prisma.featureFlag.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'beta-dashboard',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      groupId: customerExperienceGroup.id,
      key: 'beta-dashboard',
      name: 'Beta Dashboard',
      description: 'Globally enabled demo flag.',
      lifecycleStatus: 'ACTIVE',
    },
  });

  const newCheckout = await prisma.featureFlag.upsert({
    where: {
      projectId_key: {
        projectId: project.id,
        key: 'new-checkout',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      groupId: checkoutExperienceGroup.id,
      key: 'new-checkout',
      name: 'New Checkout',
      description: 'Targeted checkout rollout demo flag.',
      lifecycleStatus: 'ACTIVE',
    },
  });

  const betaDashboardProductionConfig =
    await prisma.flagEnvironmentConfig.upsert({
      where: {
        flagId_environmentId: {
          flagId: betaDashboard.id,
          environmentId: production.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        flagId: betaDashboard.id,
        environmentId: production.id,
        status: 'ENABLED',
        servingMode: 'GLOBAL_ON',
        killSwitch: false,
      },
    });

  await prisma.flagEnvironmentConfig.upsert({
    where: {
      flagId_environmentId: {
        flagId: betaDashboard.id,
        environmentId: staging.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      flagId: betaDashboard.id,
      environmentId: staging.id,
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    },
  });

  await prisma.flagEnvironmentConfig.upsert({
    where: {
      flagId_environmentId: {
        flagId: betaDashboard.id,
        environmentId: development.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      flagId: betaDashboard.id,
      environmentId: development.id,
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    },
  });

  const newCheckoutProductionConfig = await prisma.flagEnvironmentConfig.upsert(
    {
      where: {
        flagId_environmentId: {
          flagId: newCheckout.id,
          environmentId: production.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        flagId: newCheckout.id,
        environmentId: production.id,
        status: 'ENABLED',
        servingMode: 'TARGETED',
        killSwitch: false,
      },
    },
  );

  await prisma.flagEnvironmentConfig.upsert({
    where: {
      flagId_environmentId: {
        flagId: newCheckout.id,
        environmentId: staging.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      flagId: newCheckout.id,
      environmentId: staging.id,
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    },
  });

  await prisma.flagEnvironmentConfig.upsert({
    where: {
      flagId_environmentId: {
        flagId: newCheckout.id,
        environmentId: development.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      flagId: newCheckout.id,
      environmentId: development.id,
      status: 'ENABLED',
      servingMode: 'GLOBAL_ON',
      killSwitch: false,
    },
  });

  await prisma.flagRule.upsert({
    where: {
      flagConfigId_priority: {
        flagConfigId: newCheckoutProductionConfig.id,
        priority: 10,
      },
    },
    update: {},
    create: {
      flagConfigId: newCheckoutProductionConfig.id,
      type: 'USER_ALLOWLIST',
      priority: 10,
      enabled: true,
      parameters: {
        userIds: ['demo-user-admin'],
      },
    },
  });

  await prisma.flagRule.upsert({
    where: {
      flagConfigId_priority: {
        flagConfigId: newCheckoutProductionConfig.id,
        priority: 20,
      },
    },
    update: {},
    create: {
      flagConfigId: newCheckoutProductionConfig.id,
      type: 'ROLE_TARGETING',
      priority: 20,
      enabled: true,
      parameters: {
        roles: ['beta-tester'],
      },
    },
  });

  await prisma.flagRule.upsert({
    where: {
      flagConfigId_priority: {
        flagConfigId: newCheckoutProductionConfig.id,
        priority: 30,
      },
    },
    update: {},
    create: {
      flagConfigId: newCheckoutProductionConfig.id,
      type: 'PERCENTAGE_ROLLOUT',
      priority: 30,
      enabled: true,
      parameters: {
        percentage: 50,
      },
    },
  });

  type SeedRule = {
    type: 'USER_ALLOWLIST' | 'ROLE_TARGETING' | 'PERCENTAGE_ROLLOUT';
    priority: number;
    enabled?: boolean;
    parameters: Prisma.InputJsonObject;
  };

  async function upsertDemoFeatureFlag(input: {
    key: string;
    name: string;
    description: string;
    groupId: string | null;
    groupKey: string | null;
    productionServingMode: 'GLOBAL_ON' | 'TARGETED';
    rules?: SeedRule[];
  }) {
    const flag = await prisma.featureFlag.upsert({
      where: {
        projectId_key: {
          projectId: project.id,
          key: input.key,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        groupId: input.groupId,
        key: input.key,
        name: input.name,
        description: input.description,
        lifecycleStatus: 'ACTIVE',
      },
    });

    const productionConfig = await prisma.flagEnvironmentConfig.upsert({
      where: {
        flagId_environmentId: {
          flagId: flag.id,
          environmentId: production.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        flagId: flag.id,
        environmentId: production.id,
        status: 'ENABLED',
        servingMode: input.productionServingMode,
        killSwitch: false,
      },
    });

    for (const environment of [staging, development]) {
      await prisma.flagEnvironmentConfig.upsert({
        where: {
          flagId_environmentId: {
            flagId: flag.id,
            environmentId: environment.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          flagId: flag.id,
          environmentId: environment.id,
          status: 'ENABLED',
          servingMode: 'GLOBAL_ON',
          killSwitch: false,
        },
      });
    }

    for (const rule of input.rules ?? []) {
      await prisma.flagRule.upsert({
        where: {
          flagConfigId_priority: {
            flagConfigId: productionConfig.id,
            priority: rule.priority,
          },
        },
        update: {},
        create: {
          flagConfigId: productionConfig.id,
          type: rule.type,
          priority: rule.priority,
          enabled: rule.enabled ?? true,
          parameters: rule.parameters,
        },
      });
    }

    const auditKey = input.key.replace(/-/g, '_');

    await createAuditIfMissing(`audit_seed_${auditKey}_created`, {
      projectId: project.id,
      projectKey: project.key,
      targetType: 'FEATURE_FLAG',
      targetId: flag.id,
      targetKey: flag.key,
      action: 'FEATURE_FLAG_CREATED',
      actor: 'system',
      before: Prisma.DbNull,
      after: {
        key: flag.key,
        name: flag.name,
        lifecycleStatus: flag.lifecycleStatus,
        groupKey: input.groupKey,
      },
      metadata: {
        source: 'seed',
        demoFeatureMatrix: true,
      },
      requestId: 'seed_demo_feature_matrix',
    });

    await createAuditIfMissing(`audit_seed_${auditKey}_production_configured`, {
      projectId: project.id,
      projectKey: project.key,
      environmentId: production.id,
      environmentKey: production.key,
      targetType: 'FLAG_CONFIG',
      targetId: productionConfig.id,
      targetKey: flag.key,
      action: 'FLAG_CONFIG_UPDATED',
      actor: 'system',
      before: Prisma.DbNull,
      after: {
        flagKey: flag.key,
        environmentKey: production.key,
        status: productionConfig.status,
        servingMode: productionConfig.servingMode,
        killSwitch: productionConfig.killSwitch,
        rules:
          input.rules?.map((rule) => ({
            type: rule.type,
            priority: rule.priority,
            enabled: rule.enabled ?? true,
          })) ?? [],
      },
      metadata: {
        source: 'seed',
        demoFeatureMatrix: true,
      },
      requestId: 'seed_demo_feature_matrix',
    });

    return flag;
  }

  const expressPayment = await upsertDemoFeatureFlag({
    key: 'express-payment',
    name: 'Express Payment',
    description: 'Checkout group demo flag for a fast payment button.',
    groupId: checkoutExperienceGroup.id,
    groupKey: checkoutExperienceGroup.key,
    productionServingMode: 'TARGETED',
    rules: [
      {
        type: 'USER_ALLOWLIST',
        priority: 10,
        parameters: { userIds: ['demo-user-admin'] },
      },
      {
        type: 'ROLE_TARGETING',
        priority: 20,
        parameters: { roles: ['beta-tester'] },
      },
    ],
  });

  const shippingProgressMeter = await upsertDemoFeatureFlag({
    key: 'shipping-progress-meter',
    name: 'Shipping Progress Meter',
    description: 'Checkout group demo flag for free-shipping progress UI.',
    groupId: checkoutExperienceGroup.id,
    groupKey: checkoutExperienceGroup.key,
    productionServingMode: 'GLOBAL_ON',
  });

  const personalizedRecommendations = await upsertDemoFeatureFlag({
    key: 'personalized-recommendations',
    name: 'Personalized Recommendations',
    description:
      'Recommendations group demo flag for account-specific product picks.',
    groupId: recommendationsGroup.id,
    groupKey: recommendationsGroup.key,
    productionServingMode: 'TARGETED',
    rules: [
      {
        type: 'ROLE_TARGETING',
        priority: 10,
        parameters: { roles: ['beta-tester', 'admin'] },
      },
      {
        type: 'PERCENTAGE_ROLLOUT',
        priority: 20,
        parameters: { percentage: 50 },
      },
    ],
  });

  const trendingProducts = await upsertDemoFeatureFlag({
    key: 'trending-products',
    name: 'Trending Products',
    description: 'Recommendations group demo flag for the trending-now shelf.',
    groupId: recommendationsGroup.id,
    groupKey: recommendationsGroup.key,
    productionServingMode: 'GLOBAL_ON',
  });

  const holidayPromoBanner = await upsertDemoFeatureFlag({
    key: 'holiday-promo-banner',
    name: 'Holiday Promo Banner',
    description: 'Standalone demo flag not assigned to any feature group.',
    groupId: null,
    groupKey: null,
    productionServingMode: 'TARGETED',
    rules: [
      {
        type: 'USER_ALLOWLIST',
        priority: 10,
        parameters: { userIds: ['demo-user-admin'] },
      },
      {
        type: 'PERCENTAGE_ROLLOUT',
        priority: 20,
        parameters: { percentage: 75 },
      },
    ],
  });

  await prisma.sampleUserContext.upsert({
    where: {
      projectId_targetingKey: {
        projectId: project.id,
        targetingKey: 'demo-user-beta',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      displayName: 'Beta User',
      targetingKey: 'demo-user-beta',
      userId: 'demo-user-beta',
      roles: ['beta-tester'],
      attributes: { plan: 'pro' },
    },
  });

  await prisma.sampleUserContext.upsert({
    where: {
      projectId_targetingKey: {
        projectId: project.id,
        targetingKey: 'demo-user-regular',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      displayName: 'Regular User',
      targetingKey: 'demo-user-regular',
      userId: 'demo-user-regular',
      roles: ['user'],
      attributes: { plan: 'free' },
    },
  });

  await prisma.sampleUserContext.upsert({
    where: {
      projectId_targetingKey: {
        projectId: project.id,
        targetingKey: 'demo-user-admin',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      displayName: 'Admin User',
      targetingKey: 'demo-user-admin',
      userId: 'demo-user-admin',
      roles: ['admin'],
      attributes: { plan: 'pro' },
    },
  });

  await createAuditIfMissing('audit_seed_project_created', {
    projectId: project.id,
    projectKey: project.key,
    targetType: 'PROJECT',
    targetId: project.id,
    targetKey: project.key,
    action: 'PROJECT_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      key: project.key,
      name: project.name,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_production_environment_created', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'ENVIRONMENT',
    targetId: production.id,
    targetKey: production.key,
    action: 'ENVIRONMENT_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      key: production.key,
      name: production.name,
      isDefault: production.isDefault,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_customer_experience_group_created', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'FLAG_GROUP',
    targetId: customerExperienceGroup.id,
    targetKey: customerExperienceGroup.key,
    action: 'FLAG_GROUP_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      id: customerExperienceGroup.id,
      key: customerExperienceGroup.key,
      name: customerExperienceGroup.name,
      environmentKey: production.key,
      killSwitch: false,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_phase12',
  });

  for (const groupAudit of [
    {
      id: 'audit_seed_checkout_experience_group_created',
      group: checkoutExperienceGroup,
    },
    {
      id: 'audit_seed_recommendations_group_created',
      group: recommendationsGroup,
    },
  ]) {
    await createAuditIfMissing(groupAudit.id, {
      projectId: project.id,
      projectKey: project.key,
      environmentId: production.id,
      environmentKey: production.key,
      targetType: 'FLAG_GROUP',
      targetId: groupAudit.group.id,
      targetKey: groupAudit.group.key,
      action: 'FLAG_GROUP_CREATED',
      actor: 'system',
      before: Prisma.DbNull,
      after: {
        id: groupAudit.group.id,
        key: groupAudit.group.key,
        name: groupAudit.group.name,
        environmentKey: production.key,
        killSwitch: false,
      },
      metadata: {
        source: 'seed',
        demoFeatureMatrix: true,
      },
      requestId: 'seed_demo_feature_matrix',
    });
  }

  await createAuditIfMissing('audit_seed_beta_dashboard_created', {
    projectId: project.id,
    projectKey: project.key,
    targetType: 'FEATURE_FLAG',
    targetId: betaDashboard.id,
    targetKey: betaDashboard.key,
    action: 'FEATURE_FLAG_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      key: betaDashboard.key,
      name: betaDashboard.name,
      lifecycleStatus: betaDashboard.lifecycleStatus,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_beta_dashboard_group_assigned', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'FEATURE_FLAG',
    targetId: betaDashboard.id,
    targetKey: betaDashboard.key,
    action: 'FEATURE_FLAG_GROUP_ASSIGNED',
    actor: 'system',
    before: {
      flagKey: betaDashboard.key,
      groupKey: null,
    },
    after: {
      flagKey: betaDashboard.key,
      groupKey: customerExperienceGroup.key,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_phase12',
  });

  await createAuditIfMissing('audit_seed_new_checkout_created', {
    projectId: project.id,
    projectKey: project.key,
    targetType: 'FEATURE_FLAG',
    targetId: newCheckout.id,
    targetKey: newCheckout.key,
    action: 'FEATURE_FLAG_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      key: newCheckout.key,
      name: newCheckout.name,
      lifecycleStatus: newCheckout.lifecycleStatus,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_new_checkout_group_assigned', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'FEATURE_FLAG',
    targetId: newCheckout.id,
    targetKey: newCheckout.key,
    action: 'FEATURE_FLAG_GROUP_ASSIGNED',
    actor: 'system',
    before: {
      flagKey: newCheckout.key,
      groupKey: null,
    },
    after: {
      flagKey: newCheckout.key,
      groupKey: checkoutExperienceGroup.key,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_phase12',
  });

  await createAuditIfMissing('audit_seed_new_checkout_production_configured', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'FLAG_CONFIG',
    targetId: newCheckoutProductionConfig.id,
    targetKey: newCheckout.key,
    action: 'FLAG_CONFIG_UPDATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      flagKey: newCheckout.key,
      environmentKey: production.key,
      status: newCheckoutProductionConfig.status,
      servingMode: newCheckoutProductionConfig.servingMode,
      killSwitch: newCheckoutProductionConfig.killSwitch,
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_new_checkout_rules_replaced', {
    projectId: project.id,
    projectKey: project.key,
    environmentId: production.id,
    environmentKey: production.key,
    targetType: 'FLAG_CONFIG',
    targetId: newCheckoutProductionConfig.id,
    targetKey: newCheckout.key,
    action: 'FLAG_RULES_REPLACED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      flagKey: newCheckout.key,
      environmentKey: production.key,
      rules: [
        {
          type: 'USER_ALLOWLIST',
          priority: 10,
          enabled: true,
        },
        {
          type: 'ROLE_TARGETING',
          priority: 20,
          enabled: true,
        },
        {
          type: 'PERCENTAGE_ROLLOUT',
          priority: 30,
          enabled: true,
        },
      ],
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  await createAuditIfMissing('audit_seed_sample_users_created', {
    projectId: project.id,
    projectKey: project.key,
    targetType: 'SAMPLE_USER',
    targetId: project.id,
    targetKey: 'demo-sample-users',
    action: 'SAMPLE_USER_CREATED',
    actor: 'system',
    before: Prisma.DbNull,
    after: {
      sampleUsers: ['demo-user-beta', 'demo-user-regular', 'demo-user-admin'],
    },
    metadata: {
      source: 'seed',
    },
    requestId: 'seed_init',
  });

  console.log('Seed data is present.');
  console.log({
    projectKey: project.key,
    environments: [production.key, staging.key, development.key],
    flags: [
      betaDashboard.key,
      newCheckout.key,
      expressPayment.key,
      shippingProgressMeter.key,
      personalizedRecommendations.key,
      trendingProducts.key,
      holidayPromoBanner.key,
    ],
    flagGroups: [
      customerExperienceGroup.key,
      checkoutExperienceGroup.key,
      recommendationsGroup.key,
    ],
    sampleUsers: ['demo-user-beta', 'demo-user-regular', 'demo-user-admin'],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
