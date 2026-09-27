-- Secure caregiver-owned workflow functions and database invariants.
ALTER TABLE case_facts
    ALTER COLUMN provenance SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT case_facts_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000);

ALTER TABLE daily_logs
    ADD CONSTRAINT daily_logs_category_taxonomy CHECK (category IN (
        'mood', 'sleep', 'appetite', 'social_interaction', 'agitation',
        'suspiciousness', 'unusual_belief', 'hallucination_related',
        'medication_adherence', 'self_care', 'daily_functioning',
        'notable_incident', 'appointment', 'caregiver_note'
    )),
    ADD CONSTRAINT daily_logs_free_text_length CHECK (free_text IS NULL OR char_length(free_text) <= 2000),
    ADD CONSTRAINT daily_logs_not_future CHECK (observed_at <= now());

ALTER TABLE medications
    ADD CONSTRAINT medications_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
    ADD CONSTRAINT medications_schedule_length CHECK (char_length(btrim(caregiver_entered_schedule)) BETWEEN 1 AND 500);

ALTER TABLE medication_events
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT medication_events_note_length CHECK (side_effect_note IS NULL OR char_length(side_effect_note) <= 1000),
    ADD CONSTRAINT medication_events_not_future CHECK (occurred_at <= now());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER care_recipients_set_updated_at BEFORE UPDATE ON care_recipients
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER case_facts_set_updated_at BEFORE UPDATE ON case_facts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER medications_set_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.archive_daily_log_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO daily_log_history (log_id, category, intensity_rating, free_text, observed_at, version)
    VALUES (OLD.id, OLD.category, OLD.intensity_rating, OLD.free_text, OLD.observed_at, OLD.version);
    NEW.version = OLD.version + 1;
    NEW.edited_at = now();
    NEW.status = 'edited';
    RETURN NEW;
END;
$$;

CREATE TRIGGER daily_logs_archive_update BEFORE UPDATE ON daily_logs
    FOR EACH ROW EXECUTE FUNCTION public.archive_daily_log_update();

CREATE OR REPLACE FUNCTION public.complete_case_profile(
    p_preferred_name TEXT,
    p_relationship TEXT,
    p_age_band TEXT,
    p_diagnosis_summary TEXT,
    p_story TEXT
)
RETURNS care_recipients
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    recipient care_recipients;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    IF char_length(btrim(p_preferred_name)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Preferred name must be 1-100 characters' USING ERRCODE = '22023'; END IF;
    IF char_length(btrim(p_relationship)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Relationship is required' USING ERRCODE = '22023'; END IF;
    IF char_length(btrim(p_age_band)) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Age band is required' USING ERRCODE = '22023'; END IF;
    IF char_length(btrim(p_story)) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Story must be 1-4000 characters' USING ERRCODE = '22023'; END IF;

    UPDATE care_recipients SET
        preferred_name = btrim(p_preferred_name),
        relationship_to_caregiver = btrim(p_relationship),
        age_band = btrim(p_age_band),
        diagnosis_summary = nullif(btrim(p_diagnosis_summary), ''),
        version = version + 1
    WHERE owner_caregiver_id = account_id AND deleted_at IS NULL
    RETURNING * INTO recipient;

    IF recipient.id IS NULL THEN RAISE EXCEPTION 'Care recipient shell not found' USING ERRCODE = 'P0002'; END IF;

    INSERT INTO case_facts (care_recipient_id, fact_type, fact_category, content, provenance, status)
    VALUES (recipient.id, 'story_narrative', 'background', btrim(p_story), 'caregiver_reported', 'active');

    UPDATE onboarding_state SET case_content_added = true, status = 'complete', updated_at = now()
    WHERE caregiver_id = account_id AND disclaimer_acknowledged = true;

    RETURN recipient;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_daily_log(
    p_category TEXT,
    p_intensity_rating SMALLINT,
    p_free_text TEXT,
    p_observed_at TIMESTAMPTZ
)
RETURNS daily_logs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    recipient_id UUID;
    result daily_logs;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    SELECT id INTO recipient_id FROM care_recipients WHERE owner_caregiver_id = account_id AND status = 'active' AND deleted_at IS NULL;
    IF recipient_id IS NULL THEN RAISE EXCEPTION 'Active care recipient not found' USING ERRCODE = 'P0002'; END IF;
    INSERT INTO daily_logs (care_recipient_id, author_caregiver_id, category, intensity_rating, free_text, observed_at)
    VALUES (recipient_id, account_id, p_category, nullif(p_intensity_rating, 0), nullif(btrim(p_free_text), ''), p_observed_at)
    RETURNING * INTO result;
    IF p_free_text ~* '(suicid|kill myself|harm myself|end my life|immediate danger)' THEN
        INSERT INTO risk_events (care_recipient_id, source, country_code)
        VALUES (recipient_id, 'log', 'IN');
    END IF;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_medication(
    p_name TEXT,
    p_schedule TEXT,
    p_start_date DATE
)
RETURNS medications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    recipient_id UUID;
    result medications;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    SELECT id INTO recipient_id FROM care_recipients WHERE owner_caregiver_id = account_id AND status = 'active' AND deleted_at IS NULL;
    IF recipient_id IS NULL THEN RAISE EXCEPTION 'Active care recipient not found' USING ERRCODE = 'P0002'; END IF;
    INSERT INTO medications (care_recipient_id, name, caregiver_entered_schedule, start_date)
    VALUES (recipient_id, btrim(p_name), btrim(p_schedule), p_start_date)
    RETURNING * INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_medication_event(
    p_medication_id UUID,
    p_status TEXT,
    p_occurred_at TIMESTAMPTZ,
    p_side_effect_note TEXT,
    p_confirm_after_discontinuation BOOLEAN DEFAULT false
)
RETURNS medication_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    medication medications;
    result medication_events;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    SELECT m.* INTO medication FROM medications m
    JOIN care_recipients c ON c.id = m.care_recipient_id
    WHERE m.id = p_medication_id AND c.owner_caregiver_id = account_id;
    IF medication.id IS NULL THEN RAISE EXCEPTION 'Medication not found' USING ERRCODE = 'P0002'; END IF;
    IF medication.status = 'discontinued' AND p_confirm_after_discontinuation IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Confirmation required for a discontinued medication' USING ERRCODE = '22023';
    END IF;
    INSERT INTO medication_events (medication_id, status, side_effect_note, occurred_at, logged_after_discontinuation)
    VALUES (medication.id, p_status, nullif(btrim(p_side_effect_note), ''), p_occurred_at, medication.status = 'discontinued')
    RETURNING * INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.discontinue_medication(p_medication_id UUID)
RETURNS medications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    result medications;
BEGIN
    UPDATE medications m SET status = 'discontinued', discontinued_at = now(), version = m.version + 1
    FROM care_recipients c
    WHERE m.id = p_medication_id AND c.id = m.care_recipient_id AND c.owner_caregiver_id = account_id
    RETURNING m.* INTO result;
    IF result.id IS NULL THEN RAISE EXCEPTION 'Medication not found' USING ERRCODE = 'P0002'; END IF;
    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_case_profile(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_daily_log(TEXT, SMALLINT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_medication(TEXT, TEXT, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_medication_event(UUID, TEXT, TIMESTAMPTZ, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.discontinue_medication(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_case_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_daily_log(TEXT, SMALLINT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_medication(TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_medication_event(UUID, TEXT, TIMESTAMPTZ, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discontinue_medication(UUID) TO authenticated;

DROP POLICY daily_logs_caregiver_policy ON daily_logs;
CREATE POLICY daily_logs_caregiver_select ON daily_logs FOR SELECT TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));
CREATE POLICY daily_logs_caregiver_update ON daily_logs FOR UPDATE TO authenticated
    USING (author_caregiver_id = auth.uid() AND care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (author_caregiver_id = auth.uid() AND care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

DROP POLICY medications_caregiver_policy ON medications;
CREATE POLICY medications_caregiver_select ON medications FOR SELECT TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

DROP POLICY medication_events_caregiver_policy ON medication_events;
CREATE POLICY medication_events_caregiver_select ON medication_events FOR SELECT TO authenticated
    USING (medication_id IN (SELECT m.id FROM medications m JOIN care_recipients c ON c.id = m.care_recipient_id WHERE c.owner_caregiver_id = auth.uid()));

REVOKE INSERT, DELETE ON daily_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON medications FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON medication_events FROM authenticated;
