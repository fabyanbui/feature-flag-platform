import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { API_PREFIX } from '../src/common/constants/api.constants';
import { ApiErrorCode } from '../src/common/errors/api-error-code';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { RequestContextMiddleware } from '../src/common/middleware/request-context.middleware';
import { RequestContextService } from '../src/common/request-context/request-context.service';
import {
  bearer,
  configureRbacTestEnvironment,
  RBAC_TEST_CREDENTIALS,
} from './rbac-test-credentials';

export async function createE2eApp(
  options: { defaultAuthorization?: boolean } = {},
): Promise<INestApplication<App>> {
  configureRbacTestEnvironment();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<App>();

  if (options.defaultAuthorization !== false) {
    app.use((request, _response, next) => {
      if (!request.headers.authorization) {
        request.headers.authorization = bearer(
          RBAC_TEST_CREDENTIALS.admin.token,
        );
      }
      next();
    });
  }

  const requestContext = moduleFixture.get<RequestContextService>(
    RequestContextService,
  );
  const requestContextMiddleware = new RequestContextMiddleware(requestContext);

  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));
  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        return new BadRequestException({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Request validation failed.',
          details: errors.flatMap((error) =>
            Object.values(error.constraints ?? {}).map((message) => ({
              field: error.property,
              message,
            })),
          ),
        });
      },
    }),
  );

  app.useGlobalFilters(app.get(ApiExceptionFilter));

  await app.init();

  return app;
}
