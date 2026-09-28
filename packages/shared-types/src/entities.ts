import type {
  Provenance,
  LogCategoryValue,
  MedicationStatus,
  MedicationEventStatus,
  CareRecipientStatus,
  CaseFactStatus,
  CaseFactType,
  DocumentStatus,
  ConversationStatus,
  MessageRole,
  ChangeSignalDirection,
  ChangeSignalStatus,
  SummaryStatus,
  CrisisSource,
  AuditResult,
  DailyLogStatus,
} from './enums';

export interface Caregiver {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
export interface CareRecipient {
  id: string;
  caregiver_id: string;
  name: string;
  date_of_birth?: string;
  relationship: string;
  status: CareRecipientStatus;
  created_at: Date;
  updated_at: Date;
}
export interface CaseFact {
  id: string;
  care_recipient_id: string;
  fact_type: CaseFactType;
  content: string;
  source_document_id?: string;
  status: CaseFactStatus;
  provenance: Provenance;
  created_at: Date;
  updated_at: Date;
}
export interface Document {
  id: string;
  care_recipient_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: DocumentStatus;
  uploaded_at: Date;
  processed_at?: Date;
}
export interface DailyLog {
  id: string;
  care_recipient_id: string;
  category: LogCategoryValue;
  content: string;
  severity_score?: number;
  status: DailyLogStatus;
  observed_at: Date;
  created_at: Date;
  updated_at: Date;
}
export interface Medication {
  id: string;
  care_recipient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: MedicationStatus;
  created_at: Date;
  updated_at: Date;
}
export interface MedicationEvent {
  id: string;
  medication_id: string;
  status: MedicationEventStatus;
  scheduled_time: Date;
  actual_time?: Date;
  notes?: string;
  created_at: Date;
}
export interface Conversation {
  id: string;
  caregiver_id: string;
  status: ConversationStatus;
  started_at: Date;
  updated_at: Date;
}
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: Date;
}
export interface ChangeSignal {
  id: string;
  care_recipient_id: string;
  category: LogCategoryValue;
  direction: ChangeSignalDirection;
  confidence_score: number;
  status: ChangeSignalStatus;
  detected_at: Date;
}
export interface Summary {
  id: string;
  care_recipient_id: string;
  period_start: Date;
  period_end: Date;
  content: string;
  status: SummaryStatus;
  created_at: Date;
  updated_at: Date;
}
export interface Crisis {
  id: string;
  care_recipient_id: string;
  source: CrisisSource;
  severity: string;
  description: string;
  flagged_at: Date;
}
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  result: AuditResult;
  created_at: Date;
}
