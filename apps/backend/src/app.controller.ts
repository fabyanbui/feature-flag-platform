import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'feature-flag-backend',
      },
    },
  })
  @Get()
  @Public()
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
