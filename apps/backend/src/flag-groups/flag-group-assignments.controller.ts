import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permission';
import { ProjectFlagKeyParamDto } from '../common/dto/key-param.dto';
import { FeatureFlagResponseDto } from '../feature-flags/dto/feature-flag-response.dto';
import { AssignFlagGroupDto } from './dto/assign-flag-group.dto';
import { FlagGroupsService } from './flag-groups.service';

@ApiTags('Flag Groups')
@ApiBearerAuth('demoBearer')
@Controller('projects/:projectKey/flags/:flagKey/group')
export class FlagGroupAssignmentsController {
  constructor(private readonly flagGroupsService: FlagGroupsService) {}

  @Put()
  @RequirePermissions(Permission.GROUP_ASSIGN)
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
  @RequirePermissions(Permission.GROUP_ASSIGN)
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
