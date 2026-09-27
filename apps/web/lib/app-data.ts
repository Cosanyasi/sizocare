import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedContext(options?: { requireActive?: boolean }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/auth');

  const [{ data: onboarding }, { data: recipient }] = await Promise.all([
    supabase.from('onboarding_state').select('*').single(),
    supabase.from('care_recipients').select('*').single(),
  ]);

  if (!onboarding?.disclaimer_acknowledged) redirect('/onboarding');
  if (options?.requireActive && onboarding.status !== 'complete') redirect('/onboarding');

  return { supabase, user: authData.user, onboarding, recipient };
}

export function formatCategory(category: string) {
  return category.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', options ?? { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
