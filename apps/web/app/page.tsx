import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/auth');
  const { data: onboarding } = await supabase.from('onboarding_state').select('status').single();
  redirect(onboarding?.status === 'complete' ? '/app/companion' : '/onboarding');
}
