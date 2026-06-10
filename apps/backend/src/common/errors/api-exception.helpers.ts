import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ApiErrorDetail } from './api-error-response';
import { ApiErrorCode } from './api-error-code';

export function validationError(
    message: string,
    details: ApiErrorDetail[] = [],
): BadRequestException {
    return new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message,
        details,
    });
}

export function notFoundError(message: string): NotFoundException {
    return new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message,
    });
}

export function conflictError(message: string): ConflictException {
    return new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message,
    });
}