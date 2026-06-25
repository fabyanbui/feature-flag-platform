import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ProjectFlagKeyParamDto,
  ProjectKeyParamDto,
} from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { FlagStatsQueryDto } from './dto/flag-stats-query.dto';
import { ProjectFlagStatsQueryDto } from './dto/project-flag-stats-query.dto';
import {
  FlagStatsResponseDto,
  FlagStatsSummaryDto,
  ProjectFlagStatsPageResponseDto,
} from './dto/stats-response.dto';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@Controller('projects/:projectKey')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats/flags')
  @ApiOkResponse({
    description:
      'Paginated aggregate evaluation statistics for flags in one project environment.',
    type: ProjectFlagStatsPageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid key, pagination, sort, or time range.',
  })
  @ApiNotFoundResponse({
    description: 'Project or environment was not found.',
  })
  listFlags(
    @Param() params: ProjectKeyParamDto,
    @Query() query: ProjectFlagStatsQueryDto,
  ): Promise<PageResponse<FlagStatsSummaryDto>> {
    return this.statsService.listFlagStats(params.projectKey, query);
  }

  @Get('flags/:flagKey/stats')
  @ApiOkResponse({
    description:
      'Aggregate evaluation totals, reasons, and hourly buckets for one flag.',
    type: FlagStatsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid key or time range.',
  })
  @ApiNotFoundResponse({
    description: 'Project, environment, or feature flag was not found.',
  })
  getFlag(
    @Param() params: ProjectFlagKeyParamDto,
    @Query() query: FlagStatsQueryDto,
  ): Promise<FlagStatsResponseDto> {
    return this.statsService.getFlagStats(
      params.projectKey,
      params.flagKey,
      query,
    );
  }
}
