import { PrismaClient } from '@prisma/client';
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
    data: Omit<Parameters<typeof prisma.auditLogEntry.create>[0]['data'], 'id'>,
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
    const project = await prisma.project.upsert({
        where: { key: 'demo-project' },
        update: {
            name: 'Demo Project',
            description: 'Seed project for feature flag demos.',
        },
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
        update: {
            name: 'Production',
            description: 'Default demo environment.',
            isDefault: true,
            sortOrder: 1,
        },
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
        update: {
            name: 'Staging',
            description: 'Pre-production testing environment.',
            isDefault: false,
            sortOrder: 2,
        },
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
        update: {
            name: 'Development',
            description: 'Local development environment.',
            isDefault: false,
            sortOrder: 3,
        },
        create: {
            projectId: project.id,
            key: 'development',
            name: 'Development',
            description: 'Local development environment.',
            isDefault: false,
            sortOrder: 3,
        },
    });

    const betaDashboard = await prisma.featureFlag.upsert({
        where: {
            projectId_key: {
                projectId: project.id,
                key: 'beta-dashboard',
            },
        },
        update: {
            name: 'Beta Dashboard',
            description: 'Globally enabled demo flag.',
            lifecycleStatus: 'ACTIVE',
            archivedAt: null,
        },
        create: {
            projectId: project.id,
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
        update: {
            name: 'New Checkout',
            description: 'Targeted checkout rollout demo flag.',
            lifecycleStatus: 'ACTIVE',
            archivedAt: null,
        },
        create: {
            projectId: project.id,
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
            update: {
                status: 'ENABLED',
                servingMode: 'GLOBAL_ON',
                killSwitch: false,
            },
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
        update: {
            status: 'ENABLED',
            servingMode: 'GLOBAL_ON',
            killSwitch: false,
        },
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
        update: {
            status: 'ENABLED',
            servingMode: 'GLOBAL_ON',
            killSwitch: false,
        },
        create: {
            projectId: project.id,
            flagId: betaDashboard.id,
            environmentId: development.id,
            status: 'ENABLED',
            servingMode: 'GLOBAL_ON',
            killSwitch: false,
        },
    });

    const newCheckoutProductionConfig =
        await prisma.flagEnvironmentConfig.upsert({
            where: {
                flagId_environmentId: {
                    flagId: newCheckout.id,
                    environmentId: production.id,
                },
            },
            update: {
                status: 'ENABLED',
                servingMode: 'TARGETED',
                killSwitch: false,
            },
            create: {
                projectId: project.id,
                flagId: newCheckout.id,
                environmentId: production.id,
                status: 'ENABLED',
                servingMode: 'TARGETED',
                killSwitch: false,
            },
        });

    await prisma.flagEnvironmentConfig.upsert({
        where: {
            flagId_environmentId: {
                flagId: newCheckout.id,
                environmentId: staging.id,
            },
        },
        update: {
            status: 'ENABLED',
            servingMode: 'GLOBAL_ON',
            killSwitch: false,
        },
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
        update: {
            status: 'ENABLED',
            servingMode: 'GLOBAL_ON',
            killSwitch: false,
        },
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
        update: {
            type: 'USER_ALLOWLIST',
            enabled: true,
            parameters: {
                userIds: ['demo-user-admin'],
            },
        },
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
        update: {
            type: 'ROLE_TARGETING',
            enabled: true,
            parameters: {
                roles: ['beta-tester'],
            },
        },
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
        update: {
            type: 'PERCENTAGE_ROLLOUT',
            enabled: true,
            parameters: {
                percentage: 50,
            },
        },
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

    await prisma.sampleUserContext.upsert({
        where: {
            projectId_targetingKey: {
                projectId: project.id,
                targetingKey: 'demo-user-beta',
            },
        },
        update: {
            displayName: 'Beta User',
            userId: 'demo-user-beta',
            roles: ['beta-tester'],
            attributes: { plan: 'pro' },
        },
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
        update: {
            displayName: 'Regular User',
            userId: 'demo-user-regular',
            roles: ['user'],
            attributes: { plan: 'free' },
        },
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
        update: {
            displayName: 'Admin User',
            userId: 'demo-user-admin',
            roles: ['admin'],
            attributes: { plan: 'pro' },
        },
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
        before: null,
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
        before: null,
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

    await createAuditIfMissing('audit_seed_beta_dashboard_created', {
        projectId: project.id,
        projectKey: project.key,
        targetType: 'FEATURE_FLAG',
        targetId: betaDashboard.id,
        targetKey: betaDashboard.key,
        action: 'FEATURE_FLAG_CREATED',
        actor: 'system',
        before: null,
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

    await createAuditIfMissing('audit_seed_new_checkout_created', {
        projectId: project.id,
        projectKey: project.key,
        targetType: 'FEATURE_FLAG',
        targetId: newCheckout.id,
        targetKey: newCheckout.key,
        action: 'FEATURE_FLAG_CREATED',
        actor: 'system',
        before: null,
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
        before: null,
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
        before: null,
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
        before: null,
        after: {
            sampleUsers: [
                'demo-user-beta',
                'demo-user-regular',
                'demo-user-admin',
            ],
        },
        metadata: {
            source: 'seed',
        },
        requestId: 'seed_init',
    });

    console.log('Seed data created successfully.');
    console.log({
        projectKey: project.key,
        environments: [production.key, staging.key, development.key],
        flags: [betaDashboard.key, newCheckout.key],
        sampleUsers: [
            'demo-user-beta',
            'demo-user-regular',
            'demo-user-admin',
        ],
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