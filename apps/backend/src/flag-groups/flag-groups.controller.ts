import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  ProjectGroupKeyParamDto,
  ProjectKeyParamDto,
} from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
import { CreateFlagGroupDto } from './dto/create-flag-group.dto';
import { FlagGroupQueryDto } from './dto/flag-group-query.dto';
import { FlagGroupResponseDto } from './dto/flag-group-response.dto';
import { UpdateFlagGroupConfigDto } from './dto/update-flag-group-config.dto';
import { UpdateFlagGroupDto } from './dto/update-flag-group.dto';
import { FlagGroupsService } from './flag-groups.service';

@ApiTags('Flag Groups')
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
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiCreatedResponse({ type: FlagGroupResponseDto })
  create(
    @Param() params: ProjectKeyParamDto,
    @Body() body: CreateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    return this.flagGroupsService.create(params.projectKey, body);
  }

  @Patch(':groupKey')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
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

  @Put(':groupKey/config')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
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
