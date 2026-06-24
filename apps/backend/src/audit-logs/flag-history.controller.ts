import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProjectFlagKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { FlagHistoryQueryDto } from './dto/flag-history-query.dto';

@ApiTags('Flag History')
@Controller('projects/:projectKey/flags/:flagKey/history')
export class FlagHistoryController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Paginated configuration history for the selected flag.',
    type: AuditLogResponseDto,
    isArray: true,
  })
  list(
    @Param() params: ProjectFlagKeyParamDto,
    @Query() query: FlagHistoryQueryDto,
  ): Promise<PageResponse<AuditLogResponseDto>> {
    return this.auditLogsService.listFlagHistory(
      params.projectKey,
      params.flagKey,
      query,
    );
  }
}
