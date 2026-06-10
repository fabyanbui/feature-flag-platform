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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { ProjectKeyParamDto } from '../common/dto/key-param.dto';
import { PageResponse } from '../common/dto/page-response.dto';
import { ActorRequiredGuard } from '../common/guards/actor-required.guard';
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
@Controller('projects/:projectKey/sample-users')
export class SampleUsersController {
  constructor(private readonly sampleUsersService: SampleUsersService) {}

  @Get()
  @ApiOkResponse({ type: SampleUserResponseDto, isArray: true })
  list(
    @Param() params: ProjectKeyParamDto,
    @Query() query: SampleUserQueryDto,
  ): Promise<PageResponse<SampleUserResponseDto>> {
    return this.sampleUsersService.list(params.projectKey, query);
  }

  @Post()
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @ApiCreatedResponse({ type: SampleUserResponseDto })
  create(
    @Param() params: ProjectKeyParamDto,
    @Body() body: CreateSampleUserDto,
  ): Promise<SampleUserResponseDto> {
    return this.sampleUsersService.create(params.projectKey, body);
  }

  @Delete(':targetingKey')
  @UseGuards(ActorRequiredGuard)
  @ApiSecurity('actor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  delete(@Param() params: SampleUserKeyParamDto): Promise<void> {
    return this.sampleUsersService.delete(
      params.projectKey,
      params.targetingKey,
    );
  }
}
