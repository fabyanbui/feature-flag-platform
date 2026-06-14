import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiErrorCode } from '../errors/api-error-code';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const requestContext = {
    getRequestId: jest.fn(),
  };

  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };

  const host = {
    switchToHttp: jest.fn(),
  };

  let filter: ApiExceptionFilter;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    requestContext.getRequestId.mockReturnValue('req-test');
    response.status.mockReturnValue(response);
    host.switchToHttp.mockReturnValue({
      getResponse: () => response,
    });

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter = new ApiExceptionFilter(requestContext as never);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('preserves API-shaped HttpException response', () => {
    const exception = new HttpException(
      {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Invalid request.',
        details: [
          {
            field: 'projectKey',
            message: 'projectKey is invalid.',
          },
        ],
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Invalid request.',
      details: [
        {
          field: 'projectKey',
          message: 'projectKey is invalid.',
        },
      ],
      requestId: 'req-test',
    });
  });

  it('maps generic BadRequestException to VALIDATION_ERROR', () => {
    filter.catch(new BadRequestException('Bad input'), host as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Request validation failed.',
      requestId: 'req-test',
    });
  });

  it('maps generic NotFoundException to NOT_FOUND', () => {
    filter.catch(new NotFoundException('Missing'), host as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.NOT_FOUND,
      message: 'Resource not found.',
      requestId: 'req-test',
    });
  });

  it('maps generic ConflictException to CONFLICT', () => {
    filter.catch(new ConflictException('Conflict'), host as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.CONFLICT,
      message: 'Resource conflict.',
      requestId: 'req-test',
    });
  });

  it('maps unknown HttpException status to INTERNAL_ERROR', () => {
    filter.catch(
      new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      requestId: 'req-test',
    });
  });

  it('maps unknown errors to INTERNAL_ERROR without exposing stack', () => {
    const exception = new Error('sensitive database stack');

    filter.catch(exception, host as never);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      requestId: 'req-test',
    });
    expect(response.json).not.toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      }),
    );
  });

  it('logs unknown errors with request ID for server diagnostics', () => {
    const exception = new Error('database unavailable');

    filter.catch(exception, host as never);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requestId=req-test'),
      expect.any(String),
    );
  });
});
