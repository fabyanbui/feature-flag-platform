import { ApiProperty } from '@nestjs/swagger';
import { EvaluationReason } from '../../evaluation/engine/evaluation.types';

export class EvaluationReasonCountDto {
  @ApiProperty({ enum: EvaluationReason })
  reason!: EvaluationReason;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: 42 })
  count!: number;
}

export class FlagStatsSummaryDto {
  @ApiProperty({ example: 'new-checkout' })
  flagKey!: string;

  @ApiProperty({ example: 120 })
  totalEvaluations!: number;

  @ApiProperty({ example: 78 })
  enabledCount!: number;

  @ApiProperty({ example: 42 })
  disabledCount!: number;

  @ApiProperty({
    type: EvaluationReasonCountDto,
    isArray: true,
  })
  topReasons!: EvaluationReasonCountDto[];
}

export class EvaluationTimeBucketDto {
  @ApiProperty({
    example: '2026-06-25T08:00:00.000Z',
  })
  bucketStart!: Date;

  @ApiProperty({ example: 20 })
  totalEvaluations!: number;

  @ApiProperty({ example: 13 })
  enabledCount!: number;

  @ApiProperty({ example: 7 })
  disabledCount!: number;
}

export class FlagStatsResponseDto {
  @ApiProperty({ example: 'demo-project' })
  projectKey!: string;

  @ApiProperty({ example: 'new-checkout' })
  flagKey!: string;

  @ApiProperty({ example: 'production' })
  environmentKey!: string;

  @ApiProperty({ example: '2026-06-24T08:00:00.000Z' })
  from!: Date;

  @ApiProperty({ example: '2026-06-25T08:00:00.000Z' })
  to!: Date;

  @ApiProperty({ example: 120 })
  totalEvaluations!: number;

  @ApiProperty({ example: 78 })
  enabledCount!: number;

  @ApiProperty({ example: 42 })
  disabledCount!: number;

  @ApiProperty({
    example: 65,
    description: 'Enabled evaluations as a percentage from 0 through 100.',
  })
  enabledPercentage!: number;

  @ApiProperty({
    type: EvaluationReasonCountDto,
    isArray: true,
  })
  reasons!: EvaluationReasonCountDto[];

  @ApiProperty({
    type: EvaluationTimeBucketDto,
    isArray: true,
  })
  buckets!: EvaluationTimeBucketDto[];
}

export class StatsPageMetadataDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}

export class ProjectFlagStatsPageResponseDto {
  @ApiProperty({
    type: FlagStatsSummaryDto,
    isArray: true,
  })
  items!: FlagStatsSummaryDto[];

  @ApiProperty({
    type: StatsPageMetadataDto,
  })
  page!: StatsPageMetadataDto;
}
