/**
 * Feature flag definitions per MVP Implementation Plan §13.
 *
 * All flags default to their MVP state.
 * V1-deferred and future capabilities default to OFF.
 */

export interface FeatureFlags {
  /** Companion AI chat is available. Default: On */
  companion_enabled: boolean;
  /** Document upload and AI extraction pipeline is available. Default: On */
  document_upload_enabled: boolean;
  /** Change Detection job runs on schedule. Default: On */
  change_detection_enabled: boolean;
  /** Multi-caregiver collaboration (V1). Default: Off */
  collab_enabled: boolean;
  /** Bring Your Own Key for AI providers (future). Default: Off */
  byok_enabled: boolean;
  /** WhatsApp/Telegram messaging integrations (Phase 3 roadmap). Default: Off */
  messaging_integrations_enabled: boolean;
  /** Application-level envelope encryption for Restricted data (ADR-002). Default: Off for internal dogfood */
  envelope_encryption_enforced: boolean;
}

export const FEATURE_FLAG_DEFAULTS: FeatureFlags = {
  companion_enabled: true,
  document_upload_enabled: true,
  change_detection_enabled: true,
  collab_enabled: false,
  byok_enabled: true,
  messaging_integrations_enabled: false,
  envelope_encryption_enforced: false,
} as const;

export type FeatureFlagKey = keyof FeatureFlags;
