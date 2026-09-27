import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { copy } from '@/lib/copy';
import { AuthForm } from './auth-form';
import { CrisisLine } from '@/components/crisis-line';

export default async function AuthPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/');

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-labelledby="auth-heading">
        <Link className="wordmark" href="/">{copy.brand}</Link>
        <div className="story-copy"><h1 id="auth-heading">{copy.auth.title}</h1><p>{copy.auth.intro}</p></div>
        <div className="privacy-note"><span>Private by design</span><p>Your family&apos;s information is kept behind your account and is never public.</p></div>
      </section>
      <section className="auth-workspace" aria-label="Account form"><AuthForm /><CrisisLine /></section>
    </main>
  );
}
