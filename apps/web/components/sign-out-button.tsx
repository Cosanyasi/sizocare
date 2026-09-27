'use client';

import { LogOut } from 'lucide-react';
import { clearAiSession } from '@/lib/ai-session';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  async function signOut() {
    clearAiSession();
    await createClient().auth.signOut();
    window.location.assign('/auth');
  }

  return <button className={compact ? 'text-action' : 'sign-out-link'} type="button" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button>;
}
