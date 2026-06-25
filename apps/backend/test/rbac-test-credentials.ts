export const RBAC_TEST_CREDENTIALS = {
  admin: {
    token: 'phase16-admin-test-token',
    actor: 'demo-admin',
  },
  developer: {
    token: 'phase16-developer-test-token',
    actor: 'demo-developer',
  },
  viewer: {
    token: 'phase16-viewer-test-token',
    actor: 'demo-viewer',
  },
} as const;

export function configureRbacTestEnvironment(): void {
  process.env.DEMO_ADMIN_TOKEN = RBAC_TEST_CREDENTIALS.admin.token;
  process.env.DEMO_ADMIN_ACTOR = RBAC_TEST_CREDENTIALS.admin.actor;
  process.env.DEMO_DEVELOPER_TOKEN = RBAC_TEST_CREDENTIALS.developer.token;
  process.env.DEMO_DEVELOPER_ACTOR = RBAC_TEST_CREDENTIALS.developer.actor;
  process.env.DEMO_VIEWER_TOKEN = RBAC_TEST_CREDENTIALS.viewer.token;
  process.env.DEMO_VIEWER_ACTOR = RBAC_TEST_CREDENTIALS.viewer.actor;
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
