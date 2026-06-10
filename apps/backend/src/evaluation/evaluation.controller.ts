import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { EvaluateRequestDto } from './dto/evaluate-request.dto';
import { EvaluateResponseDto } from './dto/evaluate-response.dto';
import { EvaluationService } from './evaluation.service';

@ApiTags('Evaluation')
@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EvaluateResponseDto })
  evaluate(@Body() body: EvaluateRequestDto): Promise<EvaluateResponseDto> {
    return this.evaluationService.evaluate(body);
  }
}
