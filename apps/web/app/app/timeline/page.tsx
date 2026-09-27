import Link from 'next/link';
import { formatCategory, formatDate, getAuthenticatedContext } from '@/lib/app-data';

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ category?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await getAuthenticatedContext({ requireActive: true });
  let query = supabase.from('daily_logs').select('*').neq('status', 'deleted').order('observed_at', { ascending: false });
  if (params.category) query = query.eq('category', params.category);
  const { data: logs } = await query;
  const categories = Array.from(new Set(logs?.map((log) => log.category) ?? []));

  return <div className="page-stack">
    <header className="page-heading"><p>Timeline</p><h1>Your observations, in order.</h1><span>Filter the record without turning individual notes into conclusions.</span></header>
    {params.saved ? <p className="success-message" role="status">Observation saved. It is now part of the timeline.</p> : null}
    <div className="timeline-layout">
      <aside className="filter-panel"><h2>Filter</h2><Link className={!params.category ? 'active' : ''} href="/app/timeline">All observations</Link>{categories.map((category) => <Link className={params.category === category ? 'active' : ''} href={`/app/timeline?category=${category}`} key={category}>{formatCategory(category)}</Link>)}</aside>
      <section aria-label="Observation timeline">{logs?.length ? <ol className="timeline-list">{logs.map((log) => <li key={log.id}><time>{formatDate(log.observed_at)}</time><div><span>{formatCategory(log.category)}</span>{log.intensity_rating ? <strong>Intensity {log.intensity_rating}/5</strong> : null}<p>{log.free_text || 'No additional note recorded.'}</p><small>Recorded {formatDate(log.created_at ?? log.observed_at)}</small></div></li>)}</ol> : <div className="empty-state"><h2>No matching observations</h2><p>Change the filter or add a new observation.</p><Link href="/app/log/new">Log an observation</Link></div>}</section>
    </div>
  </div>;
}
