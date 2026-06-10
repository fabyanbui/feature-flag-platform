import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ProjectFlagKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
import { ReplaceRulesDto } from './dto/replace-rules.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { RuleResponseDto } from './dto/rule-response.dto';
import { FlagRulesService } from './flag-rules.service';

@ApiTags('Rules')
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
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
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
