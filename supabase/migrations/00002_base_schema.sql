-- 1. consent_records
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES auth.users(id),
    consent_type TEXT CHECK (consent_type IN ('ai_processing', 'document_ai_processing', 'analytics')),
    granted_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);
CREATE UNIQUE INDEX idx_consent_records_active ON consent_records (caregiver_id, consent_type) WHERE revoked_at IS NULL;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- 2. onboarding_state
CREATE TABLE onboarding_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    disclaimer_acknowledged BOOLEAN DEFAULT false,
    case_content_added BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('pending', 'complete')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;

-- 3. care_recipients
CREATE TABLE care_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_caregiver_id UUID NOT NULL REFERENCES auth.users(id),
    preferred_name TEXT NOT NULL,
    relationship_to_caregiver TEXT NOT NULL,
    age_band TEXT NOT NULL,
    diagnosis_summary TEXT,
    status TEXT CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;

-- 4. documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    storage_path TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'docx', 'jpg', 'png')),
    size_bytes INTEGER CHECK (size_bytes > 0 AND size_bytes <= 26214400),
    ai_processing_consent_id UUID REFERENCES consent_records(id),
    status TEXT CHECK (status IN ('uploading', 'processing', 'extracted', 'reviewed', 'failed', 'deleted')),
    ocr_confidence NUMERIC(4,3),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. case_facts
CREATE TABLE case_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    fact_type TEXT NOT NULL,
    fact_category TEXT NOT NULL,
    content TEXT NOT NULL,
    provenance TEXT CHECK (provenance IN ('caregiver_reported', 'patient_reported', 'document_extracted', 'ai_organized')),
    source_document_id UUID REFERENCES documents(id),
    status TEXT CHECK (status IN ('pending_review', 'active', 'superseded', 'deleted')),
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);
ALTER TABLE case_facts ENABLE ROW LEVEL SECURITY;

-- 6. conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    caregiver_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    policy_version TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 7. messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    role TEXT CHECK (role IN ('caregiver', 'assistant')),
    content TEXT NOT NULL,
    crisis_flagged BOOLEAN DEFAULT false,
    boundary_redirect_category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8. daily_logs
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    author_caregiver_id UUID NOT NULL REFERENCES auth.users(id),
    category TEXT NOT NULL,
    intensity_rating SMALLINT CHECK (intensity_rating BETWEEN 1 AND 5),
    free_text TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('active', 'edited', 'deleted')) DEFAULT 'active',
    version INTEGER DEFAULT 1
);
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- 9. daily_log_history
CREATE TABLE daily_log_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES daily_logs(id),
    category TEXT NOT NULL,
    intensity_rating SMALLINT,
    free_text TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    version INTEGER NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE daily_log_history ENABLE ROW LEVEL SECURITY;

-- 10. medications
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    name TEXT NOT NULL,
    caregiver_entered_schedule TEXT NOT NULL,
    start_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'discontinued')) DEFAULT 'active',
    discontinued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1
);
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- 11. medication_events
CREATE TABLE medication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id),
    status TEXT CHECK (status IN ('taken', 'missed', 'unknown')),
    side_effect_note TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    logged_after_discontinuation BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE medication_events ENABLE ROW LEVEL SECURITY;

-- 12. change_signals
CREATE TABLE change_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    category TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('increase', 'decrease')),
    recent_period_start DATE,
    recent_period_end DATE,
    baseline_period_start DATE,
    baseline_period_end DATE,
    recent_data_point_count INTEGER,
    baseline_data_point_count INTEGER,
    rule_version TEXT NOT NULL,
    status TEXT CHECK (status IN ('surfaced', 'acknowledged', 'dismissed')) DEFAULT 'surfaced',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE change_signals ENABLE ROW LEVEL SECURITY;

-- 13. clinical_summaries
CREATE TABLE clinical_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    period_start DATE,
    period_end DATE,
    content JSONB NOT NULL,
    status TEXT CHECK (status IN ('generating', 'draft', 'edited', 'approved')) DEFAULT 'generating',
    superseded_by UUID REFERENCES clinical_summaries(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1
);
ALTER TABLE clinical_summaries ENABLE ROW LEVEL SECURITY;

-- 14. risk_events
CREATE TABLE risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    source TEXT CHECK (source IN ('companion', 'log')),
    country_code TEXT,
    false_positive_reported BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

-- 15. boundary_redirect_events
CREATE TABLE boundary_redirect_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id),
    category TEXT NOT NULL,
    source TEXT CHECK (source IN ('companion')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE boundary_redirect_events ENABLE ROW LEVEL SECURITY;

-- 16. audit_events
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ DEFAULT now(),
    actor_ref UUID NOT NULL,
    action TEXT NOT NULL,
    resource_ref TEXT NOT NULL,
    purpose_code TEXT,
    result TEXT CHECK (result IN ('allow', 'deny', 'success', 'failure')),
    metadata JSONB
);
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 17. idempotency_keys
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL,
    key TEXT NOT NULL,
    route TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response_body JSONB,
    response_status INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (caregiver_id, key)
);
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- 18. crisis_resources
CREATE TABLE crisis_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE crisis_resources ENABLE ROW LEVEL SECURITY;
