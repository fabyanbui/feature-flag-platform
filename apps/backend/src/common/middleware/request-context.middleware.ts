import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  ACTOR_HEADER,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from '../constants/api.constants';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const incomingRequestId = req.header(REQUEST_ID_HEADER);
    const requestId =
      incomingRequestId && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : `req_${randomUUID()}`;

    const incomingActor = req.header(ACTOR_HEADER);
    const actor =
      incomingActor && incomingActor.trim().length > 0
        ? incomingActor.trim()
        : undefined;

    res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);

    this.requestContext.run(
      {
        requestId,
        actor,
      },
      next,
    );
  }
}
