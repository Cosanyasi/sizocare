-- Phase 1 account bootstrap and disclaimer gate.
ALTER TABLE onboarding_state
    ADD COLUMN is_adult BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN is_family_or_trusted_supporter BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN disclaimer_acknowledged_at TIMESTAMPTZ;

ALTER TABLE care_recipients
    ALTER COLUMN preferred_name DROP NOT NULL,
    ALTER COLUMN relationship_to_caregiver DROP NOT NULL,
    ALTER COLUMN age_band DROP NOT NULL,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL;

CREATE UNIQUE INDEX care_recipients_one_per_caregiver
    ON care_recipients (owner_caregiver_id)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.bootstrap_caregiver_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.onboarding_state (caregiver_id)
    VALUES (NEW.id)
    ON CONFLICT (caregiver_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.bootstrap_caregiver_account();

CREATE OR REPLACE FUNCTION public.acknowledge_disclaimer(
    p_is_adult BOOLEAN,
    p_is_family_or_trusted_supporter BOOLEAN
)
RETURNS onboarding_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    account_id UUID := auth.uid();
    result onboarding_state;
BEGIN
    IF account_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
    END IF;

    IF p_is_adult IS DISTINCT FROM true OR p_is_family_or_trusted_supporter IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Both eligibility attestations are required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO onboarding_state (
        caregiver_id,
        disclaimer_acknowledged,
        disclaimer_acknowledged_at,
        is_adult,
        is_family_or_trusted_supporter,
        updated_at
    ) VALUES (
        account_id,
        true,
        now(),
        true,
        true,
        now()
    )
    ON CONFLICT (caregiver_id) DO UPDATE SET
        disclaimer_acknowledged = true,
        disclaimer_acknowledged_at = COALESCE(onboarding_state.disclaimer_acknowledged_at, now()),
        is_adult = true,
        is_family_or_trusted_supporter = true,
        updated_at = now()
    RETURNING * INTO result;

    INSERT INTO care_recipients (owner_caregiver_id, status)
    VALUES (account_id, 'active')
    ON CONFLICT (owner_caregiver_id) WHERE deleted_at IS NULL DO NOTHING;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_disclaimer(BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_disclaimer(BOOLEAN, BOOLEAN) TO authenticated;

DROP POLICY onboarding_state_caregiver_policy ON onboarding_state;

CREATE POLICY onboarding_state_caregiver_select ON onboarding_state
    FOR SELECT TO authenticated
    USING (caregiver_id = auth.uid());

-- Milestones are changed only by narrowly scoped database functions.
REVOKE INSERT, UPDATE, DELETE ON onboarding_state FROM authenticated;

DROP POLICY conversations_caregiver_policy ON conversations;
CREATE POLICY conversations_caregiver_policy ON conversations
    FOR ALL TO authenticated
    USING (
        caregiver_id = auth.uid()
        AND care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    )
    WITH CHECK (
        caregiver_id = auth.uid()
        AND care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    );
