import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DemoRole } from '../demo-role';
import { Permission } from '../permission';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const requestContext = {
    getRole: jest.fn(),
  };
  const executionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  let guard: PermissionGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReset();
    guard = new PermissionGuard(
      reflector as unknown as Reflector,
      requestContext as never,
    );
  });

  it('allows explicitly public routes without permission metadata', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(undefined);
    expect(guard.canActivate(executionContext as never)).toBe(true);
  });

  it('allows a role with every required permission', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Permission.RULE_MANAGE]);
    requestContext.getRole.mockReturnValue(DemoRole.DEVELOPER);

    expect(guard.canActivate(executionContext as never)).toBe(true);
  });

  it('forbids an authenticated role without permission', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([Permission.GROUP_KILL_SWITCH]);
    requestContext.getRole.mockReturnValue(DemoRole.DEVELOPER);

    expect(() => guard.canActivate(executionContext as never)).toThrow(
      ForbiddenException,
    );
  });

  it('fails closed when a protected route has no permission metadata', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(undefined);
    requestContext.getRole.mockReturnValue(DemoRole.ADMIN);

    expect(() => guard.canActivate(executionContext as never)).toThrow(
      ForbiddenException,
    );
  });
});
