import { getAuthenticatedContext } from '@/lib/app-data';
import { CompanionClient } from './companion-client';

export default async function CompanionPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const { supabase } = await getAuthenticatedContext({ requireActive: true });
  const requestedConversation = (await searchParams).conversation;
  const [{ data: consent }, { data: conversations }] = await Promise.all([
    supabase.from('consent_records').select('id').eq('consent_type', 'ai_processing').is('revoked_at', null).maybeSingle(),
    requestedConversation
      ? supabase.from('conversations').select('id').eq('id', requestedConversation).neq('status', 'deleted').limit(1)
      : supabase.from('conversations').select('id').eq('status', 'active').order('created_at', { ascending: false }).limit(1),
  ]);
  const conversationId = conversations?.[0]?.id;
  const { data: messages } = conversationId ? await supabase.from('messages').select('id, role, content, crisis_flagged').eq('conversation_id', conversationId).order('created_at') : { data: [] };
  return <div className="page-stack companion-page"><header className="page-heading"><h1>What would help you think this through?</h1><span>Prepare questions, organise observations, and consider communication approaches. Companion does not diagnose or prescribe.</span></header><CompanionClient initialMessages={messages ?? []} hasConsent={Boolean(consent)} historical={Boolean(requestedConversation)} /></div>;
}
