import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ProjectFlagKeyParamDto } from '../common/dto/key-param.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
import { FeatureFlagResponseDto } from '../feature-flags/dto/feature-flag-response.dto';
import { AssignFlagGroupDto } from './dto/assign-flag-group.dto';
import { FlagGroupsService } from './flag-groups.service';

@ApiTags('Flag Groups')
@Controller('projects/:projectKey/flags/:flagKey/group')
export class FlagGroupAssignmentsController {
  constructor(private readonly flagGroupsService: FlagGroupsService) {}

  @Put()
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  assign(
    @Param() params: ProjectFlagKeyParamDto,
    @Body() body: AssignFlagGroupDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.flagGroupsService.assignFlag(
      params.projectKey,
      params.flagKey,
      body,
    );
  }

  @Delete()
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiOkResponse({ type: FeatureFlagResponseDto })
  unassign(
    @Param() params: ProjectFlagKeyParamDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.flagGroupsService.unassignFlag(
      params.projectKey,
      params.flagKey,
    );
  }
}
