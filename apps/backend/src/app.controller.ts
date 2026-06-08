import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthResponse } from './app.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'feature-flag-backend',
      },
    },
  })
  @Get()
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}