'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function localDateTime() {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
}

export function DoseForm({
  medicationId,
  discontinued,
}: {
  medicationId: string;
  discontinued: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      discontinued &&
      !window.confirm('This medication is marked as stopped. Log this dose anyway?')
    )
      return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error: requestError } = await createClient().rpc('record_medication_event', {
      p_medication_id: medicationId,
      p_status: String(form.get('status')),
      p_occurred_at: new Date(String(form.get('occurred_at'))).toISOString(),
      p_side_effect_note: String(form.get('side_effect_note') ?? ''),
      p_confirm_after_discontinuation: discontinued,
    });
    if (requestError) {
      setError('The dose record could not be saved.');
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open)
    return (
      <button className="small-action" onClick={() => setOpen(true)}>
        Log dose
      </button>
    );
  return (
    <form className="dose-form" onSubmit={submit}>
      <fieldset>
        <legend>Dose status</legend>
        <div className="status-options">
          {['taken', 'missed', 'unknown'].map((status) => (
            <label key={status}>
              <input type="radio" name="status" value={status} required />
              <span>{status}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span>Date and time</span>
        <input
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={localDateTime()}
          max={localDateTime()}
        />
        <small>Change this if you are recording an earlier dose.</small>
      </label>
      <label>
        <span>
          Side-effect note <small>Optional</small>
        </span>
        <input
          name="side_effect_note"
          maxLength={1000}
          placeholder="For example, sleepiness after the evening dose"
        />
      </label>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <button className="small-action" disabled={loading}>
          {loading ? 'Saving...' : 'Save dose'}
        </button>
        <button type="button" className="text-action" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
