'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createMedicationRequestSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';

export function MedicationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createMedicationRequestSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the medication details.');
      return;
    }
    setLoading(true);
    const { error: requestError } = await createClient().rpc('create_medication', {
      p_name: parsed.data.name,
      p_schedule: parsed.data.schedule,
      p_start_date: parsed.data.start_date,
    });
    if (requestError) {
      setError('The medication could not be added. Try again.');
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open)
    return (
      <button
        className="primary-action compact-action"
        disabled={!hydrated}
        onClick={() => setOpen(true)}
      >
        Add medication
      </button>
    );
  return (
    <form className="inline-form" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <p>New record</p>
          <h2>Add a medication</h2>
        </div>
        <button type="button" className="text-action" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <label>
        <span>Medication name</span>
        <input
          name="name"
          required
          maxLength={200}
          placeholder="Enter the name shown on the prescription"
        />
      </label>
      <label>
        <span>Schedule as you understand it</span>
        <input
          name="schedule"
          required
          maxLength={500}
          placeholder="For example, once each evening"
        />
      </label>
      <label>
        <span>Start date</span>
        <input name="start_date" type="date" required max={new Date().toISOString().slice(0, 10)} />
        <small>Choose the date it was started, if known.</small>
      </label>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" disabled={loading}>
        {loading ? 'Adding...' : 'Add medication record'}
      </button>
    </form>
  );
}
