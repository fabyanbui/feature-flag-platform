import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { RequestContextService } from '../../src/common/request-context/request-context.service';

export async function createIntegrationTestingModule(): Promise<TestingModule> {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    await moduleRef.init();

    return moduleRef;
}

export function createUniqueRunId(prefix = 'it') {
    return `${prefix}-${Date.now().toString(36)}-${process.pid.toString(36)}`;
}

export async function withRequestContext<T>(
    moduleRef: TestingModule,
    input: {
        requestId: string;
        actor?: string;
    },
    callback: () => Promise<T>,
): Promise<T> {
    const requestContext = moduleRef.get(RequestContextService);

    return requestContext.run(
        {
            requestId: input.requestId,
            actor: input.actor,
        },
        callback,
    );
}