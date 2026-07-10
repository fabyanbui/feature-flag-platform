import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode } from '../../common/errors/api-error-code';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Permission } from '../permission';
import { roleHasPermissions } from '../permission-matrix';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const permissions =
      this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const role = this.requestContext.getRole();
    if (
      !role ||
      permissions.length === 0 ||
      !roleHasPermissions(role, permissions)
    ) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'The selected demo identity does not have permission.',
      });
    }

    return true;
  }
}
