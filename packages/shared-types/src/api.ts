import { ErrorCode } from './errors';

export interface ApiMeta {
  request_id: string;
  timestamp: string;
  next_cursor?: string;
  has_more?: boolean;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiList<T> {
  data: T[];
  meta: ApiMeta & { next_cursor?: string; has_more: boolean };
}

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
  };
  meta: ApiMeta;
}
