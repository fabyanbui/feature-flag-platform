import { BadRequestException } from '@nestjs/common';
import { ApiErrorCode } from '../errors/api-error-code';
import { ActorRequiredGuard } from './actor-required.guard';

describe('ActorRequiredGuard', () => {
  const requestContext = {
    getActor: jest.fn(),
  };

  let guard: ActorRequiredGuard;

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new ActorRequiredGuard(requestContext as never);
  });

  it('returns true when request context has actor', () => {
    requestContext.getActor.mockReturnValue('mentor@example.local');

    expect(guard.canActivate({})).toBe(true);
    expect(requestContext.getActor).toHaveBeenCalled();
  });

  it('throws VALIDATION_ERROR when actor is missing', () => {
    requestContext.getActor.mockReturnValue(undefined);

    expect(() => guard.canActivate({})).toThrow(BadRequestException);

    try {
      guard.canActivate({});
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
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
  });

  it('throws VALIDATION_ERROR when actor is empty string', () => {
    requestContext.getActor.mockReturnValue('');

    expect(() => guard.canActivate({})).toThrow(BadRequestException);
  });
});
