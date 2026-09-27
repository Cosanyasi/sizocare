'use client';

import { useState, type FormEvent } from 'react';
import { featureWaitlistRequestSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';

export function FeatureWaitlistForm({ feature, label }: { feature: 'chatgpt_login' | 'private_hosted_llm'; label: string }) {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined);
    const parsed = featureWaitlistRequestSchema.safeParse({ feature, email: new FormData(event.currentTarget).get('email') });
    if (!parsed.success) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    const { error: requestError } = await createClient().rpc('join_feature_waitlist', { p_feature: feature, p_email: parsed.data.email });
    setLoading(false);
    if (requestError) { setError('We could not save your interest. Please try again.'); return; }
    setSuccess(true);
  }

  if (success) return <p className="waitlist-success" role="status">You&apos;re on the list. We&apos;ll notify you when {label} is ready.</p>;
  return <form className="waitlist-form" onSubmit={submit} noValidate>
    <label><span>Email for updates</span><input name="email" type="email" autoComplete="email" required aria-invalid={Boolean(error)} placeholder="you@example.com" /></label>
    <button className="small-action" disabled={loading}>{loading ? 'Saving…' : 'Notify me'}</button>
    {error ? <p className="form-message error" role="alert">{error}</p> : null}
  </form>;
}
