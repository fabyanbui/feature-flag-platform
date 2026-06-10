import { ApiProperty } from '@nestjs/swagger';
import {
    EvaluationReason,
    EvaluationVariant,
} from '../engine/evaluation.types';

export class EvaluateResponseDto {
    @ApiProperty({
        example: 'demo-project',
    })
    projectKey!: string;

    @ApiProperty({
        example: 'new-checkout',
    })
    flagKey!: string;

    @ApiProperty({
        example: true,
    })
    enabled!: boolean;

    @ApiProperty({
        enum: ['on', 'off'],
        example: 'on',
    })
    variant!: EvaluationVariant;

    @ApiProperty({
        enum: EvaluationReason,
        example: EvaluationReason.ROLE_MATCH,
    })
    reason!: EvaluationReason;

    @ApiProperty({
        example: 'rule_123',
        nullable: true,
    })
    matchedRuleId!: string | null;
}