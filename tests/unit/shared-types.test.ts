/**
 * Smoke test: Verify shared types package builds and exports correctly.
 *
 * Requirements: Phase 0 Completion Gate
 * - "Shared types package builds and is consumed by a placeholder Next.js page"
 */
import { describe, it, expect } from 'vitest';

describe('Shared Types Package', () => {
  it('exports ErrorCode enum with all required codes', async () => {
    const { ErrorCode } = await import('@sizocare/shared-types');

    // Data/API Spec §14 — all 12 error codes
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.RESOURCE_VERSION_CONFLICT).toBe('RESOURCE_VERSION_CONFLICT');
    expect(ErrorCode.IDEMPOTENCY_KEY_REUSED).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(ErrorCode.COMPANION_CONSENT_REQUIRED).toBe('COMPANION_CONSENT_REQUIRED');
    expect(ErrorCode.DOCUMENT_CONSENT_REQUIRED).toBe('DOCUMENT_CONSENT_REQUIRED');
    expect(ErrorCode.CASE_PROFILE_INCOMPLETE).toBe('CASE_PROFILE_INCOMPLETE');
    expect(ErrorCode.INSUFFICIENT_HISTORY).toBe('INSUFFICIENT_HISTORY');
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCode.PROVIDER_UNAVAILABLE).toBe('PROVIDER_UNAVAILABLE');
  });

  it('exports ERROR_MESSAGES with safe, non-technical user messages', async () => {
    const { ErrorCode, ERROR_MESSAGES } = await import('@sizocare/shared-types');

    // Every error code has a corresponding message
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe('string');
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }

    // Verify messages don't contain technical details (Data/API Spec §14 "Safe message")
    for (const message of Object.values(ERROR_MESSAGES)) {
      expect(message).not.toMatch(/stack|trace|exception|internal|sql|postgres/i);
    }
  });

  it('exports feature flag definitions with correct defaults', async () => {
    const { FEATURE_FLAG_DEFAULTS } = await import('@sizocare/shared-types');

    // MVP Implementation Plan §13
    expect(FEATURE_FLAG_DEFAULTS.companion_enabled).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS.document_upload_enabled).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS.change_detection_enabled).toBe(true);

    // Collaboration and messaging remain deferred; user-managed AI credentials are enabled.
    expect(FEATURE_FLAG_DEFAULTS.collab_enabled).toBe(false);
    expect(FEATURE_FLAG_DEFAULTS.byok_enabled).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS.messaging_integrations_enabled).toBe(false);
  });

  it('exports LogCategory enum with the complete fixed taxonomy', async () => {
    const { LogCategory } = await import('@sizocare/shared-types');

    // Data/API Spec §6.6 — fixed category taxonomy
    const expectedCategories = [
      'mood',
      'sleep',
      'appetite',
      'social_interaction',
      'agitation',
      'suspiciousness',
      'unusual_belief',
      'hallucination_related',
      'medication_adherence',
      'self_care',
      'daily_functioning',
      'notable_incident',
      'appointment',
      'caregiver_note',
    ];

    for (const category of expectedCategories) {
      expect(Object.values(LogCategory)).toContain(category);
    }
  });
});
