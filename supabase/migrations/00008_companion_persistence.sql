CREATE OR REPLACE FUNCTION public.persist_companion_exchange(
    p_user_content TEXT,
    p_assistant_content TEXT,
    p_crisis_flagged BOOLEAN,
    p_boundary_category TEXT DEFAULT NULL
)
RETURNS conversations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    account_id UUID := auth.uid();
    recipient_id UUID;
    conversation conversations;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    IF char_length(btrim(p_user_content)) NOT BETWEEN 1 AND 8000 THEN RAISE EXCEPTION 'Message must be 1-8000 characters' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM consent_records WHERE caregiver_id = account_id AND consent_type = 'ai_processing' AND revoked_at IS NULL) THEN
        RAISE EXCEPTION 'AI processing consent required' USING ERRCODE = '22023';
    END IF;
    SELECT id INTO recipient_id FROM care_recipients WHERE owner_caregiver_id = account_id AND status = 'active' AND deleted_at IS NULL;
    IF recipient_id IS NULL THEN RAISE EXCEPTION 'Active care recipient not found' USING ERRCODE = 'P0002'; END IF;

    SELECT * INTO conversation FROM conversations
    WHERE caregiver_id = account_id AND care_recipient_id = recipient_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
    IF conversation.id IS NULL THEN
        INSERT INTO conversations (care_recipient_id, caregiver_id, title, policy_version, status)
        VALUES (recipient_id, account_id, 'Caregiver conversation', 'companion-safety-v1', 'active')
        RETURNING * INTO conversation;
    END IF;

    INSERT INTO messages (conversation_id, role, content, crisis_flagged)
    VALUES (conversation.id, 'caregiver', btrim(p_user_content), p_crisis_flagged);
    INSERT INTO messages (conversation_id, role, content, crisis_flagged, boundary_redirect_category)
    VALUES (conversation.id, 'assistant', p_assistant_content, p_crisis_flagged, p_boundary_category);
    UPDATE conversations SET updated_at = now() WHERE id = conversation.id;
    IF p_crisis_flagged THEN INSERT INTO risk_events (care_recipient_id, source, country_code) VALUES (recipient_id, 'companion', 'IN'); END IF;
    RETURN conversation;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_companion_exchange(TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_companion_exchange(TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
