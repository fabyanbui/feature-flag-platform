import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permission';
import { ProjectFlagKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ReplaceRulesDto } from './dto/replace-rules.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { RuleResponseDto } from './dto/rule-response.dto';
import { FlagRulesService } from './flag-rules.service';

@ApiTags('Rules')
@ApiBearerAuth('demoBearer')
@RequirePermissions(Permission.CONTROL_PLANE_READ)
@Controller('projects/:projectKey/flags/:flagKey/rules')
export class FlagRulesController {
  constructor(private readonly flagRulesService: FlagRulesService) {}

  @Get()
  @ApiOkResponse({ type: RuleResponseDto, isArray: true })
  list(
    @Param() params: ProjectFlagKeyParamDto,
    @Query() query: RuleQueryDto,
  ): Promise<PageResponse<RuleResponseDto>> {
    return this.flagRulesService.list(params.projectKey, params.flagKey, query);
  }

  @Put()
  @RequirePermissions(Permission.RULE_MANAGE)
  @ApiOkResponse({ type: RuleResponseDto, isArray: true })
  replace(
    @Param() params: ProjectFlagKeyParamDto,
    @Body() body: ReplaceRulesDto,
  ): Promise<RuleResponseDto[]> {
    return this.flagRulesService.replace(
      params.projectKey,
      params.flagKey,
      body,
    );
  }
}
