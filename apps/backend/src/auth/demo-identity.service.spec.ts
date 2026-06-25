import { ConfigService } from '@nestjs/config';
import { DemoIdentityService } from './demo-identity.service';
import { DemoRole } from './demo-role';

describe('DemoIdentityService', () => {
  const values: Record<string, string> = {
    DEMO_ADMIN_TOKEN: 'admin-test-token',
    DEMO_ADMIN_ACTOR: 'demo-admin',
    DEMO_DEVELOPER_TOKEN: 'developer-test-token',
    DEMO_DEVELOPER_ACTOR: 'demo-developer',
    DEMO_VIEWER_TOKEN: 'viewer-test-token',
    DEMO_VIEWER_ACTOR: 'demo-viewer',
  };

  function createService(overrides: Record<string, string | undefined> = {}) {
    const config = {
      get: jest.fn((key: string) => ({ ...values, ...overrides })[key]),
    } as unknown as ConfigService;

    return new DemoIdentityService(config);
  }

  it('resolves tokens into server-owned actor and role values', () => {
    expect(createService().resolve('developer-test-token')).toEqual({
      actor: 'demo-developer',
      role: DemoRole.DEVELOPER,
    });
  });

  it('returns undefined for invalid tokens without exposing configuration', () => {
    expect(createService().resolve('invalid-token')).toBeUndefined();
  });

  it('requires every configured token and actor', () => {
    expect(() => createService({ DEMO_VIEWER_TOKEN: undefined })).toThrow(
      'DEMO_VIEWER_TOKEN and DEMO_VIEWER_ACTOR',
    );
  });

  it('rejects duplicate tokens', () => {
    expect(() =>
      createService({ DEMO_VIEWER_TOKEN: 'admin-test-token' }),
    ).toThrow('Demo identity tokens must be unique.');
  });
});
