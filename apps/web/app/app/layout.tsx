import { getAuthenticatedContext } from '@/lib/app-data';
import { AppShell } from '@/components/app-shell';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { recipient } = await getAuthenticatedContext({ requireActive: true });
  return <AppShell recipientName={recipient?.preferred_name ?? 'your family member'} relationship={recipient?.relationship_to_caregiver}>{children}</AppShell>;
}
