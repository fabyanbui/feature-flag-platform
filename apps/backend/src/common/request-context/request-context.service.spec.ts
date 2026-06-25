import { RequestContextService } from './request-context.service';
import { DemoRole } from '../../auth/demo-role';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(() => {
    service = new RequestContextService();
  });

  it('returns unknown request ID when no context is active', () => {
    expect(service.getRequestId()).toBe('unknown');
  });

  it('returns undefined actor when no context is active', () => {
    expect(service.getActor()).toBeUndefined();
  });

  it('stores a server-resolved identity inside the active request context', () => {
    service.run(
      {
        requestId: 'req-test',
      },
      () => {
        service.setIdentity({
          actor: 'mentor@example.local',
          role: DemoRole.ADMIN,
        });
        expect(service.getRequestId()).toBe('req-test');
        expect(service.getActor()).toBe('mentor@example.local');
        expect(service.getRole()).toBe(DemoRole.ADMIN);
      },
    );
  });

  it('does not leak context after run callback completes', () => {
    service.run(
      {
        requestId: 'req-test',
      },
      () => {
        service.setIdentity({
          actor: 'mentor@example.local',
          role: DemoRole.ADMIN,
        });
        expect(service.getRequestId()).toBe('req-test');
      },
    );

    expect(service.getRequestId()).toBe('unknown');
    expect(service.getActor()).toBeUndefined();
  });

  it('isolates separate runs', () => {
    service.run(
      {
        requestId: 'req-one',
      },
      () => {
        service.setIdentity({ actor: 'actor-one', role: DemoRole.ADMIN });
        expect(service.getRequestId()).toBe('req-one');
        expect(service.getActor()).toBe('actor-one');
      },
    );

    service.run(
      {
        requestId: 'req-two',
      },
      () => {
        service.setIdentity({ actor: 'actor-two', role: DemoRole.VIEWER });
        expect(service.getRequestId()).toBe('req-two');
        expect(service.getActor()).toBe('actor-two');
      },
    );
  });

  it('restores outer context after nested run', () => {
    service.run(
      {
        requestId: 'req-outer',
      },
      () => {
        service.setIdentity({ actor: 'outer-actor', role: DemoRole.ADMIN });
        expect(service.getRequestId()).toBe('req-outer');

        service.run(
          {
            requestId: 'req-inner',
          },
          () => {
            service.setIdentity({
              actor: 'inner-actor',
              role: DemoRole.DEVELOPER,
            });
            expect(service.getRequestId()).toBe('req-inner');
            expect(service.getActor()).toBe('inner-actor');
          },
        );

        expect(service.getRequestId()).toBe('req-outer');
        expect(service.getActor()).toBe('outer-actor');
      },
    );
  });
});
