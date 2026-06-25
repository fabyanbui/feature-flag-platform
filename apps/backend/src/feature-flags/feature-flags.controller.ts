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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permission';
import {
  ProjectFlagKeyParamDto,
  ProjectKeyParamDto,
} from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { FeatureFlagQueryDto } from './dto/feature-flag-query.dto';
import { FeatureFlagResponseDto } from './dto/feature-flag-response.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@ApiBearerAuth('demoBearer')
@RequirePermissions(Permission.CONTROL_PLANE_READ)
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
  @RequirePermissions(Permission.FLAG_MANAGE)
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
  @RequirePermissions(Permission.FLAG_MANAGE)
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
  @RequirePermissions(Permission.FLAG_LIFECYCLE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  archive(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.archive(params.projectKey, params.flagKey);
  }

  @Post(':flagKey/restore')
  @RequirePermissions(Permission.FLAG_LIFECYCLE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  restore(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.restore(params.projectKey, params.flagKey);
  }
}
