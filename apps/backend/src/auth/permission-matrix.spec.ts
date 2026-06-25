import { DemoRole } from './demo-role';
import { Permission } from './permission';
import { roleHasPermissions } from './permission-matrix';

describe('Phase 16 permission matrix', () => {
  it('gives administrators every control-plane permission', () => {
    for (const permission of Object.values(Permission)) {
      expect(roleHasPermissions(DemoRole.ADMIN, [permission])).toBe(true);
    }
  });

  it('allows developers to manage flags, rules, and group assignments', () => {
    expect(
      roleHasPermissions(DemoRole.DEVELOPER, [
        Permission.CONTROL_PLANE_READ,
        Permission.FLAG_MANAGE,
        Permission.RULE_MANAGE,
        Permission.GROUP_ASSIGN,
      ]),
    ).toBe(true);
  });

  it('keeps administrative and emergency actions away from developers', () => {
    for (const permission of [
      Permission.PROJECT_MANAGE,
      Permission.FLAG_LIFECYCLE_MANAGE,
      Permission.GROUP_MANAGE,
      Permission.GROUP_KILL_SWITCH,
      Permission.SAMPLE_USER_MANAGE,
    ]) {
      expect(roleHasPermissions(DemoRole.DEVELOPER, [permission])).toBe(false);
    }
  });

  it('keeps viewers read only', () => {
    expect(
      roleHasPermissions(DemoRole.VIEWER, [Permission.CONTROL_PLANE_READ]),
    ).toBe(true);

    for (const permission of Object.values(Permission).filter(
      (candidate) => candidate !== Permission.CONTROL_PLANE_READ,
    )) {
      expect(roleHasPermissions(DemoRole.VIEWER, [permission])).toBe(false);
    }
  });
});
