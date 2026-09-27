export interface DomainEventEnvelope<T> {
  event_id: string;
  event_type: string;
  timestamp: string;
  version: string;
  payload: T;
}

export interface DocumentProcessedEvent {
  document_id: string;
  care_recipient_id: string;
  status: string;
  extracted_facts_count: number;
}

export interface LogCreatedEvent {
  log_id: string;
  care_recipient_id: string;
  category: string;
  severity_score?: number;
  requires_attention: boolean;
}

export interface MedicationEventRecordedEvent {
  event_id: string;
  medication_id: string;
  care_recipient_id: string;
  status: string;
  scheduled_time: string;
  actual_time?: string;
}

export interface ChangeSignalDetectedEvent {
  signal_id: string;
  care_recipient_id: string;
  category: string;
  direction: string;
  confidence_score: number;
}

export interface CrisisFlaggedEvent {
  crisis_id: string;
  care_recipient_id: string;
  source: string;
  severity: string;
  description: string;
}

export interface SummaryGeneratedEvent {
  summary_id: string;
  care_recipient_id: string;
  period_start: string;
  period_end: string;
  status: string;
}
