import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { ApiErrorCode } from '../../common/errors/api-error-code';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DemoIdentityService } from '../demo-identity.service';

@Injectable()
export class DemoAuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identities: DemoIdentityService,
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

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header('authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    const identity = match ? this.identities.resolve(match[1]) : undefined;

    if (!identity) {
      throw new UnauthorizedException({
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Valid demo credentials are required.',
      });
    }

    this.requestContext.setIdentity(identity);
    return true;
  }
}
