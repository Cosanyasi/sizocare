import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const password = 'Local-test-password-42';

async function createCaregiver(label) {
  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.signUp({
    email: `${label}-${suffix}@example.test`,
    password,
  });
  if (error || !data.user || !data.session)
    throw error ?? new Error('No local auth session returned');
  return { client, user: data.user };
}

const first = await createCaregiver('first');
const second = await createCaregiver('second');

const { data: bootstrapRows, error: bootstrapError } = await first.client
  .from('onboarding_state')
  .select('caregiver_id, disclaimer_acknowledged');
if (
  bootstrapError ||
  bootstrapRows?.length !== 1 ||
  bootstrapRows[0].caregiver_id !== first.user.id
) {
  throw bootstrapError ?? new Error('Signup bootstrap did not create an owned onboarding row');
}

const { error: acknowledgmentError } = await first.client.rpc('acknowledge_disclaimer', {
  p_is_adult: true,
  p_is_family_or_trusted_supporter: true,
});
if (acknowledgmentError) throw acknowledgmentError;

const { error: spoofError } = await first.client
  .from('onboarding_state')
  .update({ caregiver_id: second.user.id })
  .eq('caregiver_id', first.user.id);
if (!spoofError)
  throw new Error('Authenticated users must not directly mutate or spoof onboarding ownership');

const { data: recipients, error: recipientError } = await first.client
  .from('care_recipients')
  .select('id, owner_caregiver_id');
if (
  recipientError ||
  recipients?.length !== 1 ||
  recipients[0].owner_caregiver_id !== first.user.id
) {
  throw (
    recipientError ??
    new Error('Disclaimer acknowledgment did not create one owned recipient shell')
  );
}

const { data: leakedRows, error: rlsError } = await second.client
  .from('care_recipients')
  .select('id')
  .eq('id', recipients[0].id);
if (rlsError || leakedRows?.length !== 0) {
  throw rlsError ?? new Error('Cross-caregiver RLS leaked a recipient row');
}

const { data: reserved, error: reserveError } = await first.client.rpc('reserve_document_upload', {
  p_original_filename: 'care plan.pdf',
  p_file_type: 'pdf',
  p_size_bytes: 2048,
});
if (reserveError || !reserved?.storage_path?.startsWith(`${first.user.id}/`))
  throw reserveError ?? new Error('Secure document reservation failed');
const { data: leakedDocuments } = await second.client
  .from('documents')
  .select('id')
  .eq('id', reserved.id);
if (leakedDocuments?.length) throw new Error('Cross-caregiver RLS leaked document metadata');

const waitlistEmail = `interest-${suffix}@example.test`;
const { error: waitlistError } = await first.client.rpc('join_feature_waitlist', {
  p_feature: 'chatgpt_login',
  p_email: waitlistEmail,
});
if (waitlistError) throw waitlistError;
const { error: duplicateWaitlistError } = await first.client.rpc('join_feature_waitlist', {
  p_feature: 'chatgpt_login',
  p_email: waitlistEmail,
});
if (duplicateWaitlistError) throw new Error('Duplicate waitlist interest should be idempotent');
const { data: hiddenWaitlist, error: hiddenWaitlistError } = await first.client
  .from('feature_waitlist')
  .select('email');
if (!hiddenWaitlistError || hiddenWaitlist?.length)
  throw new Error('Collected waitlist addresses must not be directly readable');

const { error: profileError } = await first.client.rpc('complete_case_profile', {
  p_preferred_name: 'Priya',
  p_relationship: 'Sister',
  p_age_band: '25-34',
  p_diagnosis_summary: 'Caregiver-reported schizophrenia diagnosis',
  p_story: 'Priya values quiet mornings and familiar routines.',
});
if (profileError) throw profileError;

const { data: completed } = await first.client
  .from('onboarding_state')
  .select('status, case_content_added')
  .single();
if (completed?.status !== 'complete' || !completed.case_content_added)
  throw new Error('Profile completion did not activate onboarding');

const { data: log, error: logError } = await first.client.rpc('create_daily_log', {
  p_category: 'mood',
  p_intensity_rating: 3,
  p_free_text: 'A quieter afternoon.',
  p_observed_at: new Date(Date.now() - 60000).toISOString(),
});
if (logError || !log?.id || log.author_caregiver_id !== first.user.id)
  throw logError ?? new Error('Secure daily log creation failed');

const { data: medication, error: medicationError } = await first.client.rpc('create_medication', {
  p_name: 'Caregiver-entered medicine',
  p_schedule: 'As directed each evening',
  p_start_date: new Date().toISOString().slice(0, 10),
});
if (medicationError || !medication?.id)
  throw medicationError ?? new Error('Secure medication creation failed');

const { data: dose, error: doseError } = await first.client.rpc('record_medication_event', {
  p_medication_id: medication.id,
  p_status: 'taken',
  p_occurred_at: new Date(Date.now() - 60000).toISOString(),
  p_side_effect_note: '',
  p_confirm_after_discontinuation: false,
});
if (doseError || dose?.status !== 'taken')
  throw doseError ?? new Error('Secure dose creation failed');

const { data: secondLogs } = await second.client.from('daily_logs').select('id');
const { data: secondMedications } = await second.client.from('medications').select('id');
if (secondLogs?.length || secondMedications?.length)
  throw new Error('Cross-caregiver RLS leaked workflow records');

const longStory = 'Long-form family context. '.repeat(500);
const third = await createCaregiver('long-story');
await third.client.rpc('acknowledge_disclaimer', {
  p_is_adult: true,
  p_is_family_or_trusted_supporter: true,
});
const { error: longStoryError } = await third.client.rpc('complete_case_profile', {
  p_preferred_name: 'Long Story',
  p_relationship: 'Caregiver',
  p_age_band: '35-44',
  p_diagnosis_summary: '',
  p_story: longStory,
});
if (longStoryError)
  throw new Error(`Long story was incorrectly rejected: ${longStoryError.message}`);

const { error: consentError } = await first.client.rpc('grant_ai_processing_consent');
if (consentError) throw consentError;
const { data: activeConsent } = await first.client
  .from('consent_records')
  .select('id')
  .eq('consent_type', 'ai_processing')
  .is('revoked_at', null)
  .single();
if (!activeConsent) throw new Error('AI consent was not granted');

const companionResponse = await fetch(`${url}/functions/v1/companion-api`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${(await first.client.auth.getSession()).data.session.access_token}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Can you diagnose her and tell me what medication dose to use?',
  }),
});
const companionPayload = await companionResponse.json();
if (
  companionResponse.status !== 201 ||
  companionPayload.data?.boundary_redirect_category !== 'medication_advice'
) {
  throw new Error('Companion medication boundary did not block the provider-independent request');
}

await first.client.rpc('revoke_ai_processing_consent');
const { data: revokedConsent } = await first.client
  .from('consent_records')
  .select('revoked_at')
  .eq('id', activeConsent.id)
  .single();
if (!revokedConsent?.revoked_at) throw new Error('AI consent was not revoked');

console.log(
  'Profile, unlimited story, consent, logging, medication, and cross-caregiver RLS verified.',
);
