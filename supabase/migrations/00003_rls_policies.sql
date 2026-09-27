-- consent_records
CREATE POLICY consent_records_caregiver_policy ON consent_records
    FOR ALL
    TO authenticated
    USING (caregiver_id = auth.uid())
    WITH CHECK (caregiver_id = auth.uid());

-- onboarding_state
CREATE POLICY onboarding_state_caregiver_policy ON onboarding_state
    FOR ALL
    TO authenticated
    USING (caregiver_id = auth.uid())
    WITH CHECK (caregiver_id = auth.uid());

-- care_recipients
CREATE POLICY care_recipients_owner_policy ON care_recipients
    FOR ALL
    TO authenticated
    USING (owner_caregiver_id = auth.uid())
    WITH CHECK (owner_caregiver_id = auth.uid());

-- documents
CREATE POLICY documents_caregiver_policy ON documents
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- case_facts
CREATE POLICY case_facts_caregiver_policy ON case_facts
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- conversations
CREATE POLICY conversations_caregiver_policy ON conversations
    FOR ALL
    TO authenticated
    USING (caregiver_id = auth.uid())
    WITH CHECK (caregiver_id = auth.uid());

-- messages
CREATE POLICY messages_caregiver_policy ON messages
    FOR ALL
    TO authenticated
    USING (conversation_id IN (SELECT id FROM conversations WHERE caregiver_id = auth.uid()))
    WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE caregiver_id = auth.uid()));

-- daily_logs
CREATE POLICY daily_logs_caregiver_policy ON daily_logs
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- daily_log_history
CREATE POLICY daily_log_history_caregiver_policy ON daily_log_history
    FOR ALL
    TO authenticated
    USING (log_id IN (
        SELECT id FROM daily_logs WHERE care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    ))
    WITH CHECK (log_id IN (
        SELECT id FROM daily_logs WHERE care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    ));

-- medications
CREATE POLICY medications_caregiver_policy ON medications
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- medication_events
CREATE POLICY medication_events_caregiver_policy ON medication_events
    FOR ALL
    TO authenticated
    USING (medication_id IN (
        SELECT id FROM medications WHERE care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    ))
    WITH CHECK (medication_id IN (
        SELECT id FROM medications WHERE care_recipient_id IN (
            SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()
        )
    ));

-- change_signals
CREATE POLICY change_signals_caregiver_policy ON change_signals
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- clinical_summaries
CREATE POLICY clinical_summaries_caregiver_policy ON clinical_summaries
    FOR ALL
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()))
    WITH CHECK (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- risk_events
CREATE POLICY risk_events_caregiver_select_policy ON risk_events
    FOR SELECT
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- boundary_redirect_events
CREATE POLICY boundary_redirect_events_caregiver_select_policy ON boundary_redirect_events
    FOR SELECT
    TO authenticated
    USING (care_recipient_id IN (SELECT id FROM care_recipients WHERE owner_caregiver_id = auth.uid()));

-- audit_events (NO RLS policy for ordinary users, effectively denying access to normal users when RLS is enabled)
-- Service role ignores RLS, so no explicit policy is needed for it here unless we restrict other roles.

-- idempotency_keys
CREATE POLICY idempotency_keys_caregiver_policy ON idempotency_keys
    FOR ALL
    TO authenticated
    USING (caregiver_id = auth.uid())
    WITH CHECK (caregiver_id = auth.uid());

-- crisis_resources
CREATE POLICY crisis_resources_public_select ON crisis_resources
    FOR SELECT
    TO public
    USING (true);
