import {
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from '../constants/api.constants';
import { RequestContextMiddleware } from './request-context.middleware';

describe('RequestContextMiddleware', () => {
  const requestContext = {
    run: jest.fn(),
  };

  const response = {
    setHeader: jest.fn(),
  };

  const next = jest.fn();

  let middleware: RequestContextMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();

    requestContext.run.mockImplementation((_context, callback) => callback());

    middleware = new RequestContextMiddleware(requestContext as never);
  });

  function createRequest(headers: Record<string, string | undefined>) {
    return {
      header: jest.fn((name: string) => headers[name]),
    };
  }

  it('uses incoming request ID header when present', () => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: 'req-existing',
    });

    middleware.use(request as never, response as never, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      RESPONSE_REQUEST_ID_HEADER,
      'req-existing',
    );
    expect(requestContext.run).toHaveBeenCalledWith(
      {
        requestId: 'req-existing',
      },
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('trims the incoming request ID without trusting actor headers', () => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: ' req-existing ',
      'x-actor': ' mentor@example.local ',
      'x-actor-role': 'ADMIN',
    });

    middleware.use(request as never, response as never, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      RESPONSE_REQUEST_ID_HEADER,
      'req-existing',
    );
    expect(requestContext.run).toHaveBeenCalledWith(
      {
        requestId: 'req-existing',
      },
      next,
    );
  });

  it('generates request ID with req prefix when missing', () => {
    const request = createRequest({});

    middleware.use(request as never, response as never, next);

    const generatedRequestId = response.setHeader.mock.calls[0][1];

    expect(generatedRequestId).toEqual(expect.stringMatching(/^req_/));
    expect(requestContext.run).toHaveBeenCalledWith(
      {
        requestId: generatedRequestId,
      },
      next,
    );
  });

  it('generates request ID when incoming request ID is blank', () => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: '   ',
    });

    middleware.use(request as never, response as never, next);

    const generatedRequestId = response.setHeader.mock.calls[0][1];

    expect(generatedRequestId).toEqual(expect.stringMatching(/^req_/));
  });
});
