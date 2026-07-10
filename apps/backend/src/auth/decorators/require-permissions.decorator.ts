import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permission';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
