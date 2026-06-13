import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ApiErrorCode } from './api-error-code';
import {
    conflictError,
    notFoundError,
    validationError,
} from './api-exception.helpers';

describe('api exception helpers', () => {
    describe('validationError', () => {
        it('returns BadRequestException with VALIDATION_ERROR code', () => {
            const exception = validationError('Invalid request.');

            expect(exception).toBeInstanceOf(BadRequestException);
            expect(exception.getStatus()).toBe(400);
            expect(exception.getResponse()).toEqual({
                code: ApiErrorCode.VALIDATION_ERROR,
                message: 'Invalid request.',
                details: [],
            });
        });

        it('preserves validation details', () => {
            const details = [
                {
                    field: 'projectKey',
                    message: 'projectKey is invalid.',
                },
            ];

            const exception = validationError('Invalid request.', details);

            expect(exception.getResponse()).toEqual({
                code: ApiErrorCode.VALIDATION_ERROR,
                message: 'Invalid request.',
                details,
            });
        });
    });

    describe('notFoundError', () => {
        it('returns NotFoundException with NOT_FOUND code', () => {
            const exception = notFoundError('Project was not found.');

            expect(exception).toBeInstanceOf(NotFoundException);
            expect(exception.getStatus()).toBe(404);
            expect(exception.getResponse()).toEqual({
                code: ApiErrorCode.NOT_FOUND,
                message: 'Project was not found.',
            });
        });
    });

    describe('conflictError', () => {
        it('returns ConflictException with CONFLICT code', () => {
            const exception = conflictError('Project already exists.');

            expect(exception).toBeInstanceOf(ConflictException);
            expect(exception.getStatus()).toBe(409);
            expect(exception.getResponse()).toEqual({
                code: ApiErrorCode.CONFLICT,
                message: 'Project already exists.',
            });
        });
    });
});