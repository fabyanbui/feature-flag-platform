import { Module } from '@nestjs/common';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { ActorRequiredGuard } from './guards/actor-required.guard';
import { RequestContextService } from './request-context/request-context.service';

@Module({
  providers: [RequestContextService, ApiExceptionFilter, ActorRequiredGuard],
  exports: [RequestContextService, ApiExceptionFilter, ActorRequiredGuard],
})
export class CommonModule {}
