export interface ProductEventEnvelope<T> {
  event_id: string;
  event_name: string;
  timestamp: string;
  user_id: string;
  session_id?: string;
  properties: T;
}

export interface SessionStartedEvent {
  client_version: string;
  os: string;
}

export interface FeatureUsedEvent {
  feature_name: string;
  duration_ms?: number;
}

export interface ErrorEncounteredEvent {
  error_code: string;
  context: string;
}
