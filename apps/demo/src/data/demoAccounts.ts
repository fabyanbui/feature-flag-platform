export type DemoAccountRole = 'admin' | 'beta-tester' | 'user';

export type DemoAccountRecord = {
  id: string;
  title: string;
  customerLabel: string;
  accountGroup: string;
  scenarioSummary: string;
  expectedOutcome: string;
  expectedReason: string;
  userId: string;
  targetingId: string;
  role: DemoAccountRole;
  presenterNote: string;
};
