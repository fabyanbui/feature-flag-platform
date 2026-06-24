import { Injectable, NotImplementedException } from '@nestjs/common';
import { PageResponse } from '../common/dto/page-response.dto';
import { FeatureFlagResponseDto } from '../feature-flags/dto/feature-flag-response.dto';
import { AssignFlagGroupDto } from './dto/assign-flag-group.dto';
import { CreateFlagGroupDto } from './dto/create-flag-group.dto';
import { FlagGroupQueryDto } from './dto/flag-group-query.dto';
import { FlagGroupResponseDto } from './dto/flag-group-response.dto';
import { UpdateFlagGroupConfigDto } from './dto/update-flag-group-config.dto';
import { UpdateFlagGroupDto } from './dto/update-flag-group.dto';

@Injectable()
export class FlagGroupsService {
  list(
    projectKey: string,
    query: FlagGroupQueryDto,
  ): Promise<PageResponse<FlagGroupResponseDto>> {
    return this.notImplemented(projectKey, query);
  }

  create(
    projectKey: string,
    body: CreateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    return this.notImplemented(projectKey, body);
  }

  update(
    projectKey: string,
    groupKey: string,
    body: UpdateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    return this.notImplemented(projectKey, groupKey, body);
  }

  updateConfig(
    projectKey: string,
    groupKey: string,
    body: UpdateFlagGroupConfigDto,
  ): Promise<FlagGroupResponseDto> {
    return this.notImplemented(projectKey, groupKey, body);
  }

  assignFlag(
    projectKey: string,
    flagKey: string,
    body: AssignFlagGroupDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.notImplemented(projectKey, flagKey, body);
  }

  unassignFlag(
    projectKey: string,
    flagKey: string,
  ): Promise<FeatureFlagResponseDto> {
    return this.notImplemented(projectKey, flagKey);
  }

  private notImplemented(...context: unknown[]): never {
    void context;

    throw new NotImplementedException(
      'Flag-group application behavior is implemented in Phase 12 Step 5.',
    );
  }
}
