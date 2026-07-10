import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ApiErrorCode } from '../errors/api-error-code';
import { RequestContextService } from '../request-context/request-context.service';

interface ExceptionBody {
  code?: ApiErrorCode;
  message?: string;
  details?: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = this.requestContext.getRequestId();

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, requestId);
    }

    if (this.isPrismaUniqueConstraintError(exception)) {
      return response.status(HttpStatus.CONFLICT).json({
        code: ApiErrorCode.CONFLICT,
        message: 'Resource already exists.',
        requestId,
      });
    }

    this.logger.error(
      `Unhandled exception. requestId=${requestId}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      requestId,
    });
  }

  private handleHttpException(
    exception: HttpException,
    response: Response,
    requestId: string,
  ) {
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null) {
      const typedBody = body as ExceptionBody;

      if (typedBody.code) {
        return response.status(status).json({
          code: typedBody.code,
          message: typedBody.message ?? exception.message,
          details: typedBody.details,
          requestId,
        });
      }
    }

    return response.status(status).json({
      code: this.mapHttpStatusToErrorCode(status),
      message: this.mapHttpStatusToMessage(status),
      requestId,
    });
  }

  private mapHttpStatusToErrorCode(status: HttpStatus): ApiErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ApiErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ApiErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ApiErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ApiErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ApiErrorCode.CONFLICT;
      default:
        return ApiErrorCode.INTERNAL_ERROR;
    }
  }

  private mapHttpStatusToMessage(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Request validation failed.';
      case HttpStatus.UNAUTHORIZED:
        return 'Valid demo credentials are required.';
      case HttpStatus.FORBIDDEN:
        return 'The selected demo identity does not have permission.';
      case HttpStatus.NOT_FOUND:
        return 'Resource not found.';
      case HttpStatus.CONFLICT:
        return 'Resource conflict.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  private isPrismaUniqueConstraintError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002'
    );
  }
}
