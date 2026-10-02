import { ApiValidationErrorDetail, ApiErrorResponse } from '../types/api.js';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiValidationErrorDetail[] | unknown;
  public readonly isNetworkError: boolean;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: ApiValidationErrorDetail[] | unknown;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.isNetworkError = params.isNetworkError ?? false;
  }

  static fromResponse(status: number, data: unknown): ApiError {
    const errorData = data as ApiErrorResponse | undefined;
    const code = errorData?.code || 'UNKNOWN_ERROR';
    const rawMessage = errorData?.message || 'An unexpected error occurred';
    const details = errorData?.details;

    // Friendly messages mapped from HTTP status and backend codes
    let friendlyMessage = rawMessage;
    switch (status) {
      case 401:
        friendlyMessage = rawMessage.includes('Session expired') || code === 'TOKEN_EXPIRED'
          ? 'Your session has expired. Please log in again.'
          : rawMessage || 'Authentication required';
        break;
      case 403:
        friendlyMessage = rawMessage || 'You do not have permission to perform this action';
        break;
      case 404:
        friendlyMessage = rawMessage || 'The requested resource was not found';
        break;
      case 409:
        friendlyMessage = rawMessage || 'This operation conflicts with the current system state';
        break;
      case 422:
        friendlyMessage = rawMessage || 'Please check your input for errors';
        break;
      case 429:
        friendlyMessage = 'Too many requests. Please slow down and try again shortly.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        friendlyMessage = 'The server encountered an issue. Please try again later.';
        break;
    }

    return new ApiError({
      status,
      code,
      message: friendlyMessage,
      details,
    });
  }

  static networkError(message: string = 'Network error. Please check your connection.'): ApiError {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message,
      isNetworkError: true,
    });
  }

  static timeoutError(message: string = 'Request timed out. Please try again.'): ApiError {
    return new ApiError({
      status: 408,
      code: 'REQUEST_TIMEOUT',
      message,
      isNetworkError: true,
    });
  }
}
