import { ApiErrorCode } from './common/errors/api-error-code';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_PREFIX, SWAGGER_PATH } from './common/constants/api.constants';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { RequestContextService } from './common/request-context/request-context.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const requestContext = app.get(RequestContextService);
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Feature Flag Platform API')
    .setDescription(
      'Management and evaluation APIs for a mini feature flag platform.',
    )
    .setVersion('1.0')
    .addServer(`/${API_PREFIX}`)
    .addTag('Health')
    .addTag('Projects')
    .addTag('Feature Flags')
    .addTag('Rules')
    .addTag('Evaluation')
    .addTag('Statistics')
    .addTag('Sample Users')
    .addTag('Audit Logs')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Demo token',
        description:
          'Presentation-only demo identity token for control-plane access.',
      },
      'demoBearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Request-Id',
        in: 'header',
        description:
          'Optional correlation ID. If omitted, the backend generates one.',
      },
      'requestId',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument, {
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
  });

  const allowedOrigins = [
    process.env.ADMIN_ORIGIN,
    process.env.DEMO_ORIGIN,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(`Failed to start backend application: ${message}`, stack);
  process.exit(1);
});
