'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { completeCaseProfileRequestSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';

const ageBands = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65 or older'];

export function ProfileForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine) { setError('You are offline. Reconnect before saving.'); return; }
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = completeCaseProfileRequestSchema.safeParse(values);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check the highlighted information.'); return; }
    setLoading(true);
    const { error: requestError } = await createClient().rpc('complete_case_profile', {
      p_preferred_name: parsed.data.preferred_name,
      p_relationship: parsed.data.relationship,
      p_age_band: parsed.data.age_band,
      p_diagnosis_summary: parsed.data.diagnosis_summary ?? '',
      p_story: parsed.data.story,
    });
    if (requestError) { setError('Your profile could not be saved. Please try again.'); setLoading(false); return; }
    router.push('/app/companion');
    router.refresh();
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="form-grid">
        <label><span>What should we call them?</span><input name="preferred_name" required maxLength={100} autoComplete="off" placeholder="For example, Maya" disabled={!hydrated} /></label>
        <label><span>Your relationship</span><input name="relationship" required maxLength={100} placeholder="For example, sister or father" disabled={!hydrated} /></label>
        <label><span>Age range</span><select name="age_band" required defaultValue="" disabled={!hydrated}><option value="" disabled>Select an age range</option>{ageBands.map((band) => <option key={band}>{band}</option>)}</select></label>
        <label><span>Diagnosis as you understand it <small>Optional</small></span><input name="diagnosis_summary" maxLength={1000} placeholder="For example, schizophrenia diagnosed in 2022" disabled={!hydrated} /></label>
      </div>
      <label className="story-field"><span>Tell their story in your own words</span><small>Take the space you need. What has changed, what helps, and what you want to remember. You can edit this later.</small><textarea name="story" required minLength={1} rows={10} placeholder="What has changed recently? What tends to help? What would you like clinicians or family members to understand?" disabled={!hydrated} /></label>
      {error ? <p className="form-message error" role="alert">{error}</p> : null}
      <button className="primary-action" disabled={loading || !hydrated}>{loading ? 'Creating your care space...' : 'Save profile and continue'}</button>
    </form>
  );
}
