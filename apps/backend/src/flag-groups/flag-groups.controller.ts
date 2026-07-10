import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permission';
import {
  ProjectGroupKeyParamDto,
  ProjectKeyParamDto,
} from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { CreateFlagGroupDto } from './dto/create-flag-group.dto';
import { FlagGroupQueryDto } from './dto/flag-group-query.dto';
import { FlagGroupResponseDto } from './dto/flag-group-response.dto';
import { UpdateFlagGroupConfigDto } from './dto/update-flag-group-config.dto';
import { UpdateFlagGroupDto } from './dto/update-flag-group.dto';
import { FlagGroupsService } from './flag-groups.service';

@ApiTags('Flag Groups')
@ApiBearerAuth('demoBearer')
@RequirePermissions(Permission.CONTROL_PLANE_READ)
@Controller('projects/:projectKey/groups')
export class FlagGroupsController {
  constructor(private readonly flagGroupsService: FlagGroupsService) {}

  @Get()
  @ApiOkResponse({ type: FlagGroupResponseDto, isArray: true })
  list(
    @Param() params: ProjectKeyParamDto,
    @Query() query: FlagGroupQueryDto,
  ): Promise<PageResponse<FlagGroupResponseDto>> {
    return this.flagGroupsService.list(params.projectKey, query);
  }

  @Post()
  @RequirePermissions(Permission.GROUP_MANAGE)
  @ApiCreatedResponse({ type: FlagGroupResponseDto })
  create(
    @Param() params: ProjectKeyParamDto,
    @Body() body: CreateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    return this.flagGroupsService.create(params.projectKey, body);
  }

  @Patch(':groupKey')
  @RequirePermissions(Permission.GROUP_MANAGE)
  @ApiOkResponse({ type: FlagGroupResponseDto })
  update(
    @Param() params: ProjectGroupKeyParamDto,
    @Body() body: UpdateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    return this.flagGroupsService.update(
      params.projectKey,
      params.groupKey,
      body,
    );
  }

  @Delete(':groupKey')
  @HttpCode(204)
  @RequirePermissions(Permission.GROUP_MANAGE)
  @ApiNoContentResponse({ description: 'Flag group deleted.' })
  delete(@Param() params: ProjectGroupKeyParamDto): Promise<void> {
    return this.flagGroupsService.delete(params.projectKey, params.groupKey);
  }

  @Put(':groupKey/config')
  @RequirePermissions(Permission.GROUP_KILL_SWITCH)
  @ApiOkResponse({ type: FlagGroupResponseDto })
  updateConfig(
    @Param() params: ProjectGroupKeyParamDto,
    @Body() body: UpdateFlagGroupConfigDto,
  ): Promise<FlagGroupResponseDto> {
    return this.flagGroupsService.updateConfig(
      params.projectKey,
      params.groupKey,
      body,
    );
  }
}
