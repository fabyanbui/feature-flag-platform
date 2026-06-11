import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProjectKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@Controller('projects/:projectKey/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOkResponse({ type: AuditLogResponseDto, isArray: true })
  list(
    @Param() params: ProjectKeyParamDto,
    @Query() query: AuditLogQueryDto,
  ): Promise<PageResponse<AuditLogResponseDto>> {
    return this.auditLogsService.list(params.projectKey, query);
  }
}
