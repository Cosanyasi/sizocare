import Link from 'next/link';
import { ClipboardPlus, MessagesSquare } from 'lucide-react';
import { formatCategory, formatDate, getAuthenticatedContext } from '@/lib/app-data';

export default async function OverviewPage() {
  const { supabase, recipient } = await getAuthenticatedContext({ requireActive: true });
  const [{ data: logs }, { data: medications }] = await Promise.all([
    supabase.from('daily_logs').select('*').neq('status', 'deleted').order('observed_at', { ascending: false }).limit(4),
    supabase.from('medications').select('*, medication_events(*)').order('created_at', { ascending: false }),
  ]);

  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return (
    <div className="page-stack">
      <header className="page-heading"><p>{today}</p><h1>A steady view of {recipient?.preferred_name}&apos;s care.</h1><span>Record what you notice. Keep the full story ready when you need it.</span></header>
      <section className="quick-actions" aria-label="Quick actions"><Link className="primary-link" href="/app/companion"><MessagesSquare aria-hidden="true" />Open Companion</Link><Link className="secondary-link" href="/app/log/new"><ClipboardPlus aria-hidden="true" />Log an observation</Link></section>
      <div className="dashboard-grid">
        <section className="content-section"><div className="section-heading"><div><p>Recent observations</p><h2>The latest things you recorded</h2></div><Link href="/app/timeline">View timeline</Link></div>
          {logs?.length ? <ul className="record-list">{logs.map((log) => <li key={log.id}><span className="record-dot" /><div><strong>{formatCategory(log.category)}</strong><p>{log.free_text || 'No additional note'}</p></div><time>{formatDate(log.observed_at)}</time></li>)}</ul> : <div className="empty-state"><h3>Nothing recorded yet</h3><p>Your first observation can be as simple as a category and time.</p><Link href="/app/log/new">Add the first observation</Link></div>}
        </section>
        <aside className="dashboard-aside"><p>Medication record</p><strong>{medications?.filter((item) => item.status === 'active').length ?? 0}</strong><span>active medications</span><Link href="/app/medications">View medications</Link></aside>
      </div>
      <section className="boundary-strip"><strong>This is a record, not a diagnosis.</strong><span>SizoCare helps you organise observations and prepare for conversations with a clinician.</span></section>
    </div>
  );
}
