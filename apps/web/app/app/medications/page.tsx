import { formatDate, getAuthenticatedContext } from '@/lib/app-data';
import { MedicationForm } from './medication-form';
import { DoseForm } from './dose-form';

export default async function MedicationsPage() {
  const { supabase } = await getAuthenticatedContext({ requireActive: true });
  const { data: medications } = await supabase
    .from('medications')
    .select('*, medication_events(*)')
    .order('created_at', { ascending: false });
  return (
    <div className="page-stack">
      <header className="page-heading">
        <p>Medications</p>
        <h1>A factual record of what was taken.</h1>
        <span>
          Keep schedules and dose events together for your own reference and clinician
          conversations.
        </span>
      </header>
      <section className="medication-boundary">
        <strong>SizoCare does not give medication advice.</strong>
        <span>
          Do not start, stop, or change a dose based on this record. Contact the prescribing
          clinician.
        </span>
      </section>
      <MedicationForm />
      <section className="medication-list" aria-label="Medication records">
        {medications?.length ? (
          medications.map((medication) => {
            const events = [...(medication.medication_events ?? [])].sort((a, b) =>
              b.occurred_at.localeCompare(a.occurred_at),
            );
            const taken = events.filter((event) => event.status === 'taken').length;
            return (
              <article key={medication.id} className="medication-card">
                <div className="medication-title">
                  <div>
                    <span>{medication.status}</span>
                    <h2>{medication.name}</h2>
                    <p>{medication.caregiver_entered_schedule}</p>
                  </div>
                  <DoseForm
                    medicationId={medication.id}
                    discontinued={medication.status === 'discontinued'}
                  />
                </div>
                <dl>
                  <div>
                    <dt>Started</dt>
                    <dd>
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                        new Date(medication.start_date),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Recorded taken</dt>
                    <dd>
                      {taken} of {events.length} dose events
                    </dd>
                  </div>
                </dl>
                {events.length ? (
                  <details>
                    <summary>Recent dose history</summary>
                    <ul>
                      {events.slice(0, 5).map((event) => (
                        <li key={event.id}>
                          <span>{event.status}</span>
                          <time>{formatDate(event.occurred_at)}</time>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="muted-copy">No doses recorded yet.</p>
                )}
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <h2>No medications added yet</h2>
            <p>Add only what you already know from the prescription or clinician.</p>
          </div>
        )}
      </section>
    </div>
  );
}
