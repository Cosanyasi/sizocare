-- Indexes based on common access patterns implicitly requested by spec/RLS

CREATE INDEX idx_onboarding_caregiver_id ON onboarding_state(caregiver_id);
CREATE INDEX idx_care_recipients_owner ON care_recipients(owner_caregiver_id);
CREATE INDEX idx_documents_care_recipient ON documents(care_recipient_id);
CREATE INDEX idx_case_facts_care_recipient ON case_facts(care_recipient_id);
CREATE INDEX idx_case_facts_embedding ON case_facts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_conversations_caregiver ON conversations(caregiver_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_daily_logs_care_recipient ON daily_logs(care_recipient_id);
CREATE INDEX idx_daily_log_history_log ON daily_log_history(log_id);
CREATE INDEX idx_medications_care_recipient ON medications(care_recipient_id);
CREATE INDEX idx_medication_events_medication ON medication_events(medication_id);
CREATE INDEX idx_change_signals_care_recipient ON change_signals(care_recipient_id);
CREATE INDEX idx_clinical_summaries_care_recipient ON clinical_summaries(care_recipient_id);
CREATE INDEX idx_risk_events_care_recipient ON risk_events(care_recipient_id);
CREATE INDEX idx_boundary_redirect_events_care_recipient ON boundary_redirect_events(care_recipient_id);
CREATE INDEX idx_audit_events_occurred_at ON audit_events(occurred_at);
CREATE INDEX idx_crisis_resources_country ON crisis_resources(country_code);
