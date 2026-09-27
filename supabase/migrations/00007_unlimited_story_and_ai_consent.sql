-- Story narratives are intentionally unbounded because caregiver context is subjective.
-- Other atomic case facts remain bounded so generated or structured records stay reviewable.
ALTER TABLE case_facts DROP CONSTRAINT case_facts_content_length;
ALTER TABLE case_facts ADD CONSTRAINT case_facts_content_length CHECK (
    char_length(btrim(content)) >= 1
    AND (fact_type = 'story_narrative' OR char_length(content) <= 4000)
);

ALTER TABLE consent_records
    ALTER COLUMN consent_type SET NOT NULL,
    ALTER COLUMN granted_at SET NOT NULL,
    ALTER COLUMN version SET NOT NULL,
    ADD CONSTRAINT consent_revocation_after_grant CHECK (revoked_at IS NULL OR revoked_at >= granted_at);

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
    IF char_length(btrim(p_story)) < 1 THEN RAISE EXCEPTION 'Story is required' USING ERRCODE = '22023'; END IF;

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

CREATE OR REPLACE FUNCTION public.grant_ai_processing_consent()
RETURNS consent_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    result consent_records;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    INSERT INTO consent_records (caregiver_id, consent_type, granted_at, version)
    VALUES (account_id, 'ai_processing', now(), 1)
    ON CONFLICT (caregiver_id, consent_type) WHERE revoked_at IS NULL
    DO UPDATE SET granted_at = consent_records.granted_at
    RETURNING * INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_ai_processing_consent()
RETURNS consent_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result consent_records;
BEGIN
    UPDATE consent_records SET revoked_at = now(), version = version + 1
    WHERE caregiver_id = auth.uid() AND consent_type = 'ai_processing' AND revoked_at IS NULL
    RETURNING * INTO result;
    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_ai_processing_consent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_ai_processing_consent() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_ai_processing_consent() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_ai_processing_consent() TO authenticated;

DROP POLICY consent_records_caregiver_policy ON consent_records;
CREATE POLICY consent_records_caregiver_select ON consent_records
    FOR SELECT TO authenticated USING (caregiver_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON consent_records FROM authenticated;

ALTER TABLE conversations ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE conversations ALTER COLUMN status SET NOT NULL;
ALTER TABLE messages ALTER COLUMN role SET NOT NULL;
ALTER TABLE messages ALTER COLUMN crisis_flagged SET NOT NULL;

DROP POLICY messages_caregiver_policy ON messages;
CREATE POLICY messages_caregiver_select ON messages FOR SELECT TO authenticated
    USING (conversation_id IN (SELECT id FROM conversations WHERE caregiver_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON messages FROM authenticated;
