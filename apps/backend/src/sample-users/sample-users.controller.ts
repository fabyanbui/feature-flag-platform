import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permission';
import { IsString, MaxLength } from 'class-validator';
import { ProjectKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { CreateSampleUserDto } from './dto/create-sample-user.dto';
import { SampleUserQueryDto } from './dto/sample-user-query.dto';
import { SampleUserResponseDto } from './dto/sample-user-response.dto';
import { SampleUsersService } from './sample-users.service';

class SampleUserKeyParamDto extends ProjectKeyParamDto {
  @IsString()
  @MaxLength(120)
  targetingKey!: string;
}

@ApiTags('Sample Users')
@ApiExtraModels(SampleUserResponseDto)
@ApiBearerAuth('demoBearer')
@RequirePermissions(Permission.CONTROL_PLANE_READ)
@Controller('projects/:projectKey/sample-users')
export class SampleUsersController {
  constructor(private readonly sampleUsersService: SampleUsersService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(SampleUserResponseDto) },
        },
        page: {
          type: 'object',
          properties: {
            limit: { type: 'number', example: 20 },
            offset: { type: 'number', example: 0 },
            total: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: false },
          },
          required: ['limit', 'offset', 'total', 'hasNext'],
        },
      },
      required: ['items', 'page'],
    },
  })
  list(
    @Param() params: ProjectKeyParamDto,
    @Query() query: SampleUserQueryDto,
  ): Promise<PageResponse<SampleUserResponseDto>> {
    return this.sampleUsersService.list(params.projectKey, query);
  }

  @Post()
  @RequirePermissions(Permission.SAMPLE_USER_MANAGE)
  @ApiCreatedResponse({ type: SampleUserResponseDto })
  create(
    @Param() params: ProjectKeyParamDto,
    @Body() body: CreateSampleUserDto,
  ): Promise<SampleUserResponseDto> {
    return this.sampleUsersService.create(params.projectKey, body);
  }

  @Delete(':targetingKey')
  @RequirePermissions(Permission.SAMPLE_USER_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  delete(@Param() params: SampleUserKeyParamDto): Promise<void> {
    return this.sampleUsersService.delete(
      params.projectKey,
      params.targetingKey,
    );
  }
}
