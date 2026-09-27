-- Repair acknowledgement persistence and add secure document intake, conversation,
-- and coming-soon interest primitives. All identity is derived from auth.uid().

-- Repair possible production drift from the onboarding migration before replacing
-- the RPC. The old RPC's partial-index ON CONFLICT clause made acknowledgement and
-- recipient-shell creation one failing transaction when the index was absent.
ALTER TABLE public.onboarding_state
    ADD COLUMN IF NOT EXISTS is_adult BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_family_or_trusted_supporter BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS disclaimer_acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.care_recipients
    ALTER COLUMN preferred_name DROP NOT NULL,
    ALTER COLUMN relationship_to_caregiver DROP NOT NULL,
    ALTER COLUMN age_band DROP NOT NULL,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS care_recipients_one_per_caregiver
    ON public.care_recipients (owner_caregiver_id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.acknowledge_disclaimer(
    p_is_adult BOOLEAN,
    p_is_family_or_trusted_supporter BOOLEAN
)
RETURNS public.onboarding_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    account_id UUID := auth.uid();
    result public.onboarding_state;
BEGIN
    IF account_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
    END IF;
    IF p_is_adult IS DISTINCT FROM true OR p_is_family_or_trusted_supporter IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Both eligibility attestations are required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.onboarding_state (
        caregiver_id, disclaimer_acknowledged, disclaimer_acknowledged_at,
        is_adult, is_family_or_trusted_supporter, updated_at
    ) VALUES (account_id, true, now(), true, true, now())
    ON CONFLICT (caregiver_id) DO UPDATE SET
        disclaimer_acknowledged = true,
        disclaimer_acknowledged_at = COALESCE(public.onboarding_state.disclaimer_acknowledged_at, now()),
        is_adult = true,
        is_family_or_trusted_supporter = true,
        updated_at = now()
    RETURNING * INTO result;

    -- Do not rely on partial-index conflict inference, which differed between
    -- deployed schemas. Locking plus a guarded insert makes this idempotent.
    PERFORM pg_advisory_xact_lock(hashtext(account_id::text));
    IF NOT EXISTS (
        SELECT 1 FROM public.care_recipients
        WHERE owner_caregiver_id = account_id AND deleted_at IS NULL
    ) THEN
        INSERT INTO public.care_recipients (owner_caregiver_id, status)
        VALUES (account_id, 'active');
    END IF;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_disclaimer(BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_disclaimer(BOOLEAN, BOOLEAN) TO authenticated;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_status_check
    CHECK (status IN ('uploading', 'queued', 'processing', 'extracted', 'reviewed', 'failed', 'deleted'));

DROP POLICY IF EXISTS documents_caregiver_policy ON public.documents;
CREATE POLICY documents_caregiver_select ON public.documents FOR SELECT TO authenticated
    USING (care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE owner_caregiver_id = auth.uid()
    ));
REVOKE INSERT, UPDATE, DELETE ON public.documents FROM authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'patient-documents', 'patient-documents', false, 26214400,
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS patient_documents_owner_select ON storage.objects;
DROP POLICY IF EXISTS patient_documents_owner_insert ON storage.objects;
DROP POLICY IF EXISTS patient_documents_owner_delete ON storage.objects;
CREATE POLICY patient_documents_owner_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY patient_documents_owner_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY patient_documents_owner_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.reserve_document_upload(
    p_original_filename TEXT,
    p_file_type TEXT,
    p_size_bytes INTEGER
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    account_id UUID := auth.uid();
    recipient_id UUID;
    document_id UUID := gen_random_uuid();
    safe_name TEXT;
    result public.documents;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    IF p_file_type NOT IN ('pdf', 'docx', 'jpg', 'png') OR p_size_bytes NOT BETWEEN 1 AND 26214400 THEN
        RAISE EXCEPTION 'Invalid document type or size' USING ERRCODE = '22023';
    END IF;
    SELECT id INTO recipient_id FROM public.care_recipients
      WHERE owner_caregiver_id = account_id AND status = 'active' AND deleted_at IS NULL LIMIT 1;
    IF recipient_id IS NULL THEN RAISE EXCEPTION 'Care recipient not found' USING ERRCODE = 'P0002'; END IF;

    safe_name := regexp_replace(lower(p_original_filename), '[^a-z0-9._-]+', '-', 'g');
    safe_name := trim(both '-' from safe_name);
    IF safe_name = '' THEN safe_name := 'document.' || p_file_type; END IF;

    INSERT INTO public.documents (id, care_recipient_id, storage_path, file_type, size_bytes, status)
    VALUES (document_id, recipient_id, account_id::text || '/' || document_id::text || '/' || safe_name, p_file_type, p_size_bytes, 'uploading')
    RETURNING * INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_document(p_document_id UUID)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE result public.documents;
BEGIN
    UPDATE public.documents d SET status = 'queued', updated_at = now()
    WHERE d.id = p_document_id
      AND d.care_recipient_id IN (
        SELECT cr.id FROM public.care_recipients cr WHERE cr.owner_caregiver_id = auth.uid()
      )
      AND d.status = 'uploading'
    RETURNING * INTO result;
    IF result.id IS NULL THEN RAISE EXCEPTION 'Document not found' USING ERRCODE = 'P0002'; END IF;
    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_document_upload(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.queue_document(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_document_upload(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_document(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_new_conversation()
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE account_id UUID := auth.uid(); recipient_id UUID; result public.conversations;
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    SELECT id INTO recipient_id FROM public.care_recipients
      WHERE owner_caregiver_id = account_id AND status = 'active' AND deleted_at IS NULL LIMIT 1;
    IF recipient_id IS NULL THEN RAISE EXCEPTION 'Care recipient not found' USING ERRCODE = 'P0002'; END IF;
    UPDATE public.conversations SET status = 'archived', updated_at = now()
      WHERE caregiver_id = account_id AND status = 'active';
    INSERT INTO public.conversations (care_recipient_id, caregiver_id, title, policy_version, status)
      VALUES (recipient_id, account_id, 'New conversation', 'companion-safety-v1', 'active') RETURNING * INTO result;
    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.start_new_conversation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_new_conversation() TO authenticated;

CREATE OR REPLACE FUNCTION public.title_conversation_from_first_message()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF NEW.role = 'caregiver' THEN
      UPDATE public.conversations
      SET title = left(regexp_replace(btrim(NEW.content), '\s+', ' ', 'g'), 80)
      WHERE id = NEW.conversation_id AND title IN ('Caregiver conversation', 'New conversation');
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS messages_title_conversation ON public.messages;
CREATE TRIGGER messages_title_conversation AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.title_conversation_from_first_message();

CREATE TABLE IF NOT EXISTS public.feature_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL CHECK (feature IN ('chatgpt_login', 'private_hosted_llm')),
    email TEXT NOT NULL CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 320),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (caregiver_id, feature),
    UNIQUE (feature, email)
);
ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;
-- Deliberately no direct table policies: addresses cannot be enumerated by clients.

CREATE OR REPLACE FUNCTION public.join_feature_waitlist(p_feature TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE account_id UUID := auth.uid(); normalized_email TEXT := lower(btrim(p_email));
BEGIN
    IF account_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
    IF p_feature NOT IN ('chatgpt_login', 'private_hosted_llm') THEN RAISE EXCEPTION 'Unknown feature' USING ERRCODE = '22023'; END IF;
    IF normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR char_length(normalized_email) > 320 THEN
      RAISE EXCEPTION 'Invalid email' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.feature_waitlist (caregiver_id, feature, email)
      VALUES (account_id, p_feature, normalized_email)
      ON CONFLICT DO NOTHING;
    RETURN true;
END;
$$;
REVOKE ALL ON TABLE public.feature_waitlist FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.join_feature_waitlist(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_feature_waitlist(TEXT, TEXT) TO authenticated;
