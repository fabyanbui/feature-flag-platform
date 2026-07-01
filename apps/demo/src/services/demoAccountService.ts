import type { EvaluationContext } from '@ffp/js-sdk';
import type { DemoAccountRecord } from '../data/demoAccounts';
import { demoAccountSeed } from '../data/seed';

export const demoProjectKey = 'demo-project';

export type DemoScenario = DemoAccountRecord & {
  projectKey: string;
  context: EvaluationContext;
};

function toDemoScenario(account: DemoAccountRecord): DemoScenario {
  return {
    ...account,
    projectKey: demoProjectKey,
    context: {
      targetingKey: account.targetingId,
      userId: account.userId,
      roles: [account.role],
    },
  };
}

export const fallbackDemoScenarios: DemoScenario[] =
  demoAccountSeed.map(toDemoScenario);

export async function listDemoAccounts(): Promise<DemoScenario[]> {
  // Demo-app local BE: this is intentionally independent from the feature flag
  // platform backend. It models a tiny ecommerce account database with only the
  // fields needed by the SDK evaluation context.
  return fallbackDemoScenarios.map((scenario) => ({
    ...scenario,
    context: {
      ...scenario.context,
      roles: [...(scenario.context.roles ?? [])],
    },
  }));
}
