import {
  Body,
  Controller,
  Get,
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
import { ProjectKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth('demoBearer')
@RequirePermissions(Permission.CONTROL_PLANE_READ)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  list(
    @Query() query: ProjectQueryDto,
  ): Promise<PageResponse<ProjectResponseDto>> {
    return this.projectsService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.PROJECT_MANAGE)
  @ApiCreatedResponse({ type: ProjectResponseDto })
  create(@Body() body: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(body);
  }

  @Get(':projectKey')
  @ApiOkResponse({ type: ProjectResponseDto })
  get(@Param() params: ProjectKeyParamDto): Promise<ProjectResponseDto> {
    return this.projectsService.get(params.projectKey);
  }

  @Patch(':projectKey')
  @RequirePermissions(Permission.PROJECT_MANAGE)
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @Param() params: ProjectKeyParamDto,
    @Body() body: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(params.projectKey, body);
  }
}
