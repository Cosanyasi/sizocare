import { getAuthenticatedContext } from '@/lib/app-data';
import { AppShell } from '@/components/app-shell';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, recipient } = await getAuthenticatedContext({ requireActive: true });
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false })
    .limit(30);
  return (
    <AppShell
      recipientName={recipient?.preferred_name ?? 'your family member'}
      relationship={recipient?.relationship_to_caregiver}
      conversations={conversations ?? []}
    >
      {children}
    </AppShell>
  );
}
