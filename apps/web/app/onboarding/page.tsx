import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { copy } from '@/lib/copy';
import { DisclaimerForm } from './disclaimer-form';
import { ProfileForm } from './profile-form';
import { SignOutButton } from '@/components/sign-out-button';
import { CrisisLine } from '@/components/crisis-line';
import { DocumentUpload } from './document-upload';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/auth');

  const { data: state } = await supabase
    .from('onboarding_state')
    .select('disclaimer_acknowledged, case_content_added, status')
    .single();
  if (state?.status === 'complete') redirect('/app/companion');

  return (
    <main className="onboarding-shell">
      <header className="app-header">
        <Link className="wordmark" href="/onboarding">
          {copy.brand}
        </Link>
        <SignOutButton compact />
      </header>
      {!state?.disclaimer_acknowledged ? (
        <DisclaimerForm />
      ) : (
        <section className="onboarding-content" aria-labelledby="onboarding-title">
          <div className="progress-marker" aria-label="Onboarding step 1 of 3">
            <span />
          </div>
          <h1 id="onboarding-title">Let&apos;s begin with what you know.</h1>
          <p className="lead">
            A few lines about your family member will help SizoCare keep future notes grounded in
            their real story.
          </p>
          <div className="next-step">
            <p>Case profile</p>
            <h2>Tell their story in your own words</h2>
            <p>You will review everything before it becomes part of the private profile.</p>
          </div>
          <ProfileForm />
          <DocumentUpload />
          <p className="boundary-note">
            Companion and daily logging stay unavailable until you add some case context.
          </p>
        </section>
      )}
      <CrisisLine />
    </main>
  );
}
