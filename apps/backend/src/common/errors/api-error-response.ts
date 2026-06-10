import { ApiErrorCode } from './api-error-code';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
  requestId: string;
}
