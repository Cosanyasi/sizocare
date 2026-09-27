export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_VERSION_CONFLICT = 'RESOURCE_VERSION_CONFLICT',
  IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED',
  COMPANION_CONSENT_REQUIRED = 'COMPANION_CONSENT_REQUIRED',
  DOCUMENT_CONSENT_REQUIRED = 'DOCUMENT_CONSENT_REQUIRED',
  CASE_PROFILE_INCOMPLETE = 'CASE_PROFILE_INCOMPLETE',
  INSUFFICIENT_HISTORY = 'INSUFFICIENT_HISTORY',
  RATE_LIMITED = 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: "That didn't look right — please check and try again.",
  [ErrorCode.UNAUTHENTICATED]: 'Please log in again.',
  [ErrorCode.FORBIDDEN]: "You don't have access to that.",
  [ErrorCode.NOT_FOUND]: "We couldn't find that.",
  [ErrorCode.RESOURCE_VERSION_CONFLICT]: 'This was updated elsewhere — please refresh.',
  [ErrorCode.IDEMPOTENCY_KEY_REUSED]: 'That request looks different from an earlier one — please retry.',
  [ErrorCode.COMPANION_CONSENT_REQUIRED]: 'We need your consent before Companion can respond.',
  [ErrorCode.DOCUMENT_CONSENT_REQUIRED]: 'We need your consent before processing this document.',
  [ErrorCode.CASE_PROFILE_INCOMPLETE]: 'Add a bit about your family member before we start chatting.',
  [ErrorCode.INSUFFICIENT_HISTORY]: "There isn't enough history yet for this.",
  [ErrorCode.RATE_LIMITED]: "You're going a bit fast — please try again shortly.",
  [ErrorCode.PROVIDER_UNAVAILABLE]: "Companion couldn't respond just now — please try again in a moment.",
};
