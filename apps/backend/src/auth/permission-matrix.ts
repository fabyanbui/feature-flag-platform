import { DemoRole } from './demo-role';
import { Permission } from './permission';

const read = Permission.CONTROL_PLANE_READ;

export const ROLE_PERMISSIONS: Readonly<
  Record<DemoRole, ReadonlySet<Permission>>
> = {
  [DemoRole.ADMIN]: new Set(Object.values(Permission)),
  [DemoRole.DEVELOPER]: new Set([
    read,
    Permission.FLAG_MANAGE,
    Permission.RULE_MANAGE,
    Permission.GROUP_ASSIGN,
  ]),
  [DemoRole.VIEWER]: new Set([read]),
};

export function roleHasPermissions(
  role: DemoRole,
  permissions: readonly Permission[],
): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return permissions.every((permission) => granted.has(permission));
}
