import { Module } from '@nestjs/common';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { RequestContextService } from './request-context/request-context.service';

@Module({
  providers: [RequestContextService, ApiExceptionFilter],
  exports: [RequestContextService, ApiExceptionFilter],
})
export class CommonModule {}
