import {
  Body,
  Controller,
  Get,
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
import { ProjectKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
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
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
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
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @Param() params: ProjectKeyParamDto,
    @Body() body: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(params.projectKey, body);
  }
}
