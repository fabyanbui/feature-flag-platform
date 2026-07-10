import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DemoIdentity } from '../../auth/demo-identity';
import { DemoRole } from '../../auth/demo-role';

export interface RequestContext {
  requestId: string;
  identity?: DemoIdentity;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getRequestId(): string {
    return this.storage.getStore()?.requestId ?? 'unknown';
  }

  getActor(): string | undefined {
    return this.storage.getStore()?.identity?.actor;
  }

  getRole(): DemoRole | undefined {
    return this.storage.getStore()?.identity?.role;
  }

  getIdentity(): DemoIdentity | undefined {
    return this.storage.getStore()?.identity;
  }

  setIdentity(identity: DemoIdentity): void {
    const context = this.storage.getStore();
    if (context) {
      context.identity = identity;
    }
  }
}
