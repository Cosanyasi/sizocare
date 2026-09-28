/**
 * Shared enum types for SizoCare.
 *
 * These match the exact values defined in the Data/API Specifications §6.
 * Type aliases are for type-safety; enum objects are for runtime validation and iteration.
 */

// --- Type Aliases (for type-safety in function signatures) ---

export type Provenance =
  'caregiver_reported' | 'patient_reported' | 'document_extracted' | 'ai_organized';
export type ConsentType = 'ai_processing' | 'document_ai_processing' | 'analytics';
export type MedicationStatus = 'active' | 'discontinued';
export type MedicationEventStatus = 'taken' | 'missed' | 'unknown';
export type CareRecipientStatus = 'active' | 'suspended' | 'deleted';
export type CaseFactStatus = 'pending_review' | 'active' | 'superseded' | 'deleted';
export type CaseFactType =
  'story_narrative' | 'structured_field' | 'document_extracted' | 'ai_organized';
export type DocumentStatus =
  'uploading' | 'processing' | 'extracted' | 'reviewed' | 'failed' | 'deleted';
export type ConversationStatus = 'active' | 'archived' | 'deleted';
export type MessageRole = 'caregiver' | 'assistant';
export type ChangeSignalDirection = 'increase' | 'decrease';
export type ChangeSignalStatus = 'surfaced' | 'acknowledged' | 'dismissed';
export type SummaryStatus = 'generating' | 'draft' | 'edited' | 'approved';
export type CrisisSource = 'companion' | 'log';
export type AuditResult = 'allow' | 'deny' | 'success' | 'failure';
export type OnboardingStatus = 'pending' | 'complete';
export type DailyLogStatus = 'active' | 'edited' | 'deleted';

// --- Runtime Enum Objects (for iteration, validation, and test assertions) ---

/**
 * Fixed log category taxonomy per Data/API Spec §6.6.
 * This taxonomy is fixed in MVP (PRD FR-LOG BR3).
 */
export const LogCategory = {
  MOOD: 'mood',
  SLEEP: 'sleep',
  APPETITE: 'appetite',
  SOCIAL_INTERACTION: 'social_interaction',
  AGITATION: 'agitation',
  SUSPICIOUSNESS: 'suspiciousness',
  UNUSUAL_BELIEF: 'unusual_belief',
  HALLUCINATION_RELATED: 'hallucination_related',
  MEDICATION_ADHERENCE: 'medication_adherence',
  SELF_CARE: 'self_care',
  DAILY_FUNCTIONING: 'daily_functioning',
  NOTABLE_INCIDENT: 'notable_incident',
  APPOINTMENT: 'appointment',
  CAREGIVER_NOTE: 'caregiver_note',
} as const;

export type LogCategoryValue = (typeof LogCategory)[keyof typeof LogCategory];

/** All valid log categories as an array, for iteration. */
export const LOG_CATEGORIES = Object.values(LogCategory);
