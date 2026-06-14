import { RequestContextService } from './request-context.service';

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

  it('returns request ID and actor inside run callback', () => {
    service.run(
      {
        requestId: 'req-test',
        actor: 'mentor@example.local',
      },
      () => {
        expect(service.getRequestId()).toBe('req-test');
        expect(service.getActor()).toBe('mentor@example.local');
      },
    );
  });

  it('does not leak context after run callback completes', () => {
    service.run(
      {
        requestId: 'req-test',
        actor: 'mentor@example.local',
      },
      () => {
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
        actor: 'actor-one',
      },
      () => {
        expect(service.getRequestId()).toBe('req-one');
        expect(service.getActor()).toBe('actor-one');
      },
    );

    service.run(
      {
        requestId: 'req-two',
        actor: 'actor-two',
      },
      () => {
        expect(service.getRequestId()).toBe('req-two');
        expect(service.getActor()).toBe('actor-two');
      },
    );
  });

  it('restores outer context after nested run', () => {
    service.run(
      {
        requestId: 'req-outer',
        actor: 'outer-actor',
      },
      () => {
        expect(service.getRequestId()).toBe('req-outer');

        service.run(
          {
            requestId: 'req-inner',
            actor: 'inner-actor',
          },
          () => {
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
