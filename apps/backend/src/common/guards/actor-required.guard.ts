import { BadRequestException, CanActivate, Injectable } from '@nestjs/common';
import { ApiErrorCode } from '../errors/api-error-code';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class ActorRequiredGuard implements CanActivate {
  constructor(private readonly requestContext: RequestContextService) {}

  canActivate(): boolean {
    const actor = this.requestContext.getActor();

    if (!actor) {
      throw new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'X-Actor header is required for mutation requests.',
        details: [
          {
            field: 'X-Actor',
            message:
              'Provide X-Actor header so configuration changes can be audited.',
          },
        ],
      });
    }

    return true;
  }
}
