import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { DemoIdentity } from './demo-identity';
import { DemoRole } from './demo-role';

interface DemoCredential {
  token: string;
  identity: DemoIdentity;
}

@Injectable()
export class DemoIdentityService {
  private readonly credentials: DemoCredential[];

  constructor(config: ConfigService) {
    this.credentials = [
      this.readCredential(config, DemoRole.ADMIN),
      this.readCredential(config, DemoRole.DEVELOPER),
      this.readCredential(config, DemoRole.VIEWER),
    ];

    const tokens = this.credentials.map(({ token }) => token);
    if (new Set(tokens).size !== tokens.length) {
      throw new Error('Demo identity tokens must be unique.');
    }
  }

  resolve(token: string): DemoIdentity | undefined {
    const credential = this.credentials.find((candidate) =>
      this.tokensEqual(candidate.token, token),
    );

    return credential
      ? {
          actor: credential.identity.actor,
          role: credential.identity.role,
        }
      : undefined;
  }

  private readCredential(
    config: ConfigService,
    role: DemoRole,
  ): DemoCredential {
    const prefix = `DEMO_${role}`;
    const token = config.get<string>(`${prefix}_TOKEN`)?.trim();
    const actor = config.get<string>(`${prefix}_ACTOR`)?.trim();

    if (!token || !actor) {
      throw new Error(
        `${prefix}_TOKEN and ${prefix}_ACTOR must be configured for demo RBAC.`,
      );
    }

    return {
      token,
      identity: { actor, role },
    };
  }

  private tokensEqual(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);

    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }
}
