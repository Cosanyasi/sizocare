'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';
import { acknowledgeDisclaimer } from './actions';

export function DisclaimerForm() {
  const router = useRouter();
  const [adult, setAdult] = useState(false);
  const [supporter, setSupporter] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function acknowledge() {
    if (!adult || !supporter) {
      setError('Confirm both statements to continue.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const result = await acknowledgeDisclaimer({
        is_adult: adult,
        is_family_or_trusted_supporter: supporter,
      });
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('The acknowledgment could not be saved. Check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <section className="onboarding-gate" aria-labelledby="gate-title">
      <h1 id="gate-title">{copy.disclaimer.title}</h1>
      <p>{copy.disclaimer.body}</p>
      <label className="check-row">
        <input
          type="checkbox"
          checked={adult}
          onChange={(event) => setAdult(event.target.checked)}
        />
        <span>{copy.disclaimer.adult}</span>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={supporter}
          onChange={(event) => setSupporter(event.target.checked)}
        />
        <span>{copy.disclaimer.supporter}</span>
      </label>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" type="button" disabled={loading} onClick={acknowledge}>
        {loading ? 'Saving...' : 'I understand, continue'}
      </button>
    </section>
  );
}
