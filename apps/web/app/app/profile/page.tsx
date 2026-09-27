import { formatDate, getAuthenticatedContext } from '@/lib/app-data';

export default async function ProfilePage() {
  const { supabase, recipient } = await getAuthenticatedContext({ requireActive: true });
  const { data: facts } = await supabase.from('case_facts').select('*').neq('status', 'deleted').order('created_at', { ascending: false });
  return <div className="page-stack"><header className="page-heading"><p>Case profile</p><h1>{recipient?.preferred_name}&apos;s story, kept with its sources.</h1><span>This context belongs to your care space and can be corrected as your understanding changes.</span></header>
    <section className="profile-summary"><dl><div><dt>Relationship</dt><dd>{recipient?.relationship_to_caregiver}</dd></div><div><dt>Age range</dt><dd>{recipient?.age_band}</dd></div><div><dt>Diagnosis as reported</dt><dd>{recipient?.diagnosis_summary || 'Not added'}</dd></div></dl></section>
    <section className="content-section"><div className="section-heading"><div><p>Recorded context</p><h2>What you have told SizoCare</h2></div></div>{facts?.map((fact) => <article className="fact-row" key={fact.id}><div><span className="source-badge">{fact.provenance === 'caregiver_reported' ? 'You told us' : fact.provenance.replaceAll('_',' ')}</span><h3>{fact.fact_category.replaceAll('_',' ')}</h3></div><p>{fact.content}</p><small>Added {formatDate(fact.created_at ?? new Date().toISOString())}</small></article>)}</section>
  </div>;
}
