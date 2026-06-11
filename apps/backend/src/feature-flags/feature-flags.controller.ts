import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  ProjectFlagKeyParamDto,
  ProjectKeyParamDto,
} from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { FeatureFlagQueryDto } from './dto/feature-flag-query.dto';
import { FeatureFlagResponseDto } from './dto/feature-flag-response.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@Controller('projects/:projectKey/flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOkResponse({ type: FeatureFlagResponseDto, isArray: true })
  list(
    @Param() params: ProjectKeyParamDto,
    @Query() query: FeatureFlagQueryDto,
  ): Promise<PageResponse<FeatureFlagResponseDto>> {
    return this.featureFlagsService.list(params.projectKey, query);
  }

  @Post()
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiCreatedResponse({ type: FeatureFlagResponseDto })
  create(
    @Param() params: ProjectKeyParamDto,
    @Body() body: CreateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.create(params.projectKey, body);
  }

  @Get(':flagKey')
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  get(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.get(params.projectKey, params.flagKey);
  }

  @Patch(':flagKey')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  update(
    @Param() params: ProjectFlagKeyParamDto,
    @Body() body: UpdateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.update(
      params.projectKey,
      params.flagKey,
      body,
    );
  }

  @Post(':flagKey/archive')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  archive(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.archive(params.projectKey, params.flagKey);
  }

  @Post(':flagKey/restore')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  restore(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.restore(params.projectKey, params.flagKey);
  }
}
