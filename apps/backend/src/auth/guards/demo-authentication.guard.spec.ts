import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DemoRole } from '../demo-role';
import { DemoAuthenticationGuard } from './demo-authentication.guard';

describe('DemoAuthenticationGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const identities = {
    resolve: jest.fn(),
  };
  const requestContext = {
    setIdentity: jest.fn(),
  };
  const request = {
    header: jest.fn(),
  };
  const executionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: () => request,
    })),
  };

  let guard: DemoAuthenticationGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new DemoAuthenticationGuard(
      reflector as unknown as Reflector,
      identities as never,
      requestContext as never,
    );
  });

  it('allows explicitly public routes without credentials', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(executionContext as never)).toBe(true);
    expect(identities.resolve).not.toHaveBeenCalled();
  });

  it('resolves a strict bearer token before allowing access', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    request.header.mockReturnValue('Bearer admin-test-token');
    identities.resolve.mockReturnValue({
      actor: 'demo-admin',
      role: DemoRole.ADMIN,
    });

    expect(guard.canActivate(executionContext as never)).toBe(true);
    expect(requestContext.setIdentity).toHaveBeenCalledWith({
      actor: 'demo-admin',
      role: DemoRole.ADMIN,
    });
  });

  it.each([
    undefined,
    '',
    'Basic abc',
    'Bearer',
    'Bearer token with spaces',
    'bearer admin-test-token',
  ])('rejects missing or malformed authorization value %p', (authorization) => {
    reflector.getAllAndOverride.mockReturnValue(false);
    request.header.mockReturnValue(authorization);

    expect(() => guard.canActivate(executionContext as never)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown bearer token', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    request.header.mockReturnValue('Bearer invalid-token');
    identities.resolve.mockReturnValue(undefined);

    expect(() => guard.canActivate(executionContext as never)).toThrow(
      UnauthorizedException,
    );
  });
});
