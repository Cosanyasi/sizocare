'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LOG_CATEGORIES } from '@sizocare/shared-types';
import { createDailyLogRequestSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';

function formatCategory(category: string) {
  return category.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

function localDateTime() {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
}

export function LogForm() {
  const router = useRouter();
  const [category, setCategory] = useState('mood');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [crisisConcern, setCrisisConcern] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine) {
      setError('You are offline. Reconnect before saving.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const parsed = createDailyLogRequestSchema.safeParse({
      category,
      intensity_rating: form.get('intensity_rating')
        ? Number(form.get('intensity_rating'))
        : undefined,
      free_text: String(form.get('free_text') ?? ''),
      observed_at: new Date(String(form.get('observed_at'))).toISOString(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check this observation.');
      return;
    }
    const concern = /suicid|kill myself|harm myself|end my life|immediate danger/i.test(
      parsed.data.free_text ?? '',
    );
    setCrisisConcern(concern);
    setLoading(true);
    const { error: requestError } = await createClient().rpc('create_daily_log', {
      p_category: parsed.data.category,
      p_intensity_rating: parsed.data.intensity_rating ?? 0,
      p_free_text: parsed.data.free_text ?? '',
      p_observed_at: parsed.data.observed_at,
    });
    if (requestError) {
      setError('This observation could not be saved. Try again.');
      setLoading(false);
      return;
    }
    if (concern) {
      setLoading(false);
      return;
    }
    router.push('/app/timeline?saved=1');
    router.refresh();
  }

  return (
    <form className="log-form" onSubmit={submit}>
      <fieldset>
        <legend>What did you notice?</legend>
        <div className="category-grid">
          {LOG_CATEGORIES.map((item) => (
            <button
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              key={item}
            >
              {formatCategory(item)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>
          How noticeable was it? <small>Optional</small>
        </legend>
        <div className="intensity-row">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value}>
              <input type="radio" name="intensity_rating" value={value} />
              <span>{value}</span>
            </label>
          ))}
        </div>
        <div className="scale-labels">
          <span>Slight</span>
          <span>Strong</span>
        </div>
      </fieldset>
      <label>
        <span>When did you notice it?</span>
        <input
          name="observed_at"
          type="datetime-local"
          max={localDateTime()}
          defaultValue={localDateTime()}
          required
        />
      </label>
      <label>
        <span>
          Add a note <small>Optional</small>
        </span>
        <textarea
          name="free_text"
          rows={5}
          maxLength={2000}
          placeholder="Use your own words. What happened, and what context may matter later?"
        />
      </label>
      {crisisConcern ? (
        <section className="crisis-response" role="alert">
          <strong>Get immediate support now</strong>
          <p>
            SizoCare cannot determine whether someone is safe. If anyone may be in danger, call
            emergency services at <a href="tel:112">112</a> or Tele-MANAS at{' '}
            <a href="tel:14416">14416</a>. Your observation was saved.
          </p>
          <button
            type="button"
            className="text-action"
            onClick={() => router.push('/app/timeline?saved=1')}
          >
            Continue to timeline
          </button>
        </section>
      ) : null}
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" disabled={loading}>
        {loading ? 'Saving observation...' : 'Save observation'}
      </button>
    </form>
  );
}
