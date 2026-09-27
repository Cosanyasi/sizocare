'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Settings } from 'lucide-react';
import { AiProviderSetup, providerName } from '@/components/ai-provider-setup';
import { getAiSession, type AiProvider } from '@/lib/ai-session';
import { createClient } from '@/lib/supabase/client';

type Message = { id: string; role: string | null; content: string; crisis_flagged: boolean | null };

export function CompanionClient({ initialMessages, hasConsent }: { initialMessages: Message[]; hasConsent: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [consented, setConsented] = useState(hasConsent);
  const [connectedProvider, setConnectedProvider] = useState<AiProvider | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setConnectedProvider(getAiSession(data.user?.id).provider);
      setHydrated(true);
    });
  }, []);

  async function grantConsent() {
    const { error: requestError } = await createClient().rpc('grant_ai_processing_consent');
    if (requestError) setError('Consent could not be saved.'); else setConsented(true);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get('content') ?? '').trim();
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const session = getAiSession(userData.user?.id);
    if (!session.provider || !session.secret) { setError('Connect an AI provider for this browser session.'); return; }
    setLoading(true); setError(undefined);
    try {
      const { data, error: requestError } = await supabase.functions.invoke('companion-api', {
        body: { content },
        headers: { 'x-ai-provider': session.provider, 'x-ai-key': session.secret, ...(session.model ? { 'x-ai-model': session.model } : {}) },
      });
      if (requestError) throw requestError;
      if (!data?.data?.reply) throw new Error('INVALID_RESPONSE');
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'caregiver', content, crisis_flagged: data.data.crisis_flagged }, { id: crypto.randomUUID(), role: 'assistant', content: data.data.reply, crisis_flagged: data.data.crisis_flagged }]);
      form.reset();
    } catch (requestError) {
      const context = requestError && typeof requestError === 'object' && 'context' in requestError ? (requestError as { context?: Response }).context : undefined;
      const payload = context ? await context.json().catch(() => null) : null;
      setError(payload?.error?.message ?? (navigator.onLine ? 'Companion could not respond. Check the provider connection in Settings and try again.' : 'You are offline. Reconnect and try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (!consented) return <section className="consent-panel"><h2>Review what Companion will share</h2><p>When you send a message, your question and selected profile details, case facts, recent observations, medication names, and caregiver-entered schedules may be sent to your chosen provider. SizoCare does not send the entire history. You can revoke consent from Settings.</p><button className="primary-action" disabled={!hydrated} onClick={grantConsent}>I understand and consent</button>{error ? <p className="form-message error" role="alert">{error}</p> : null}</section>;

  if (hydrated && !connectedProvider) return <section className="first-run-panel"><AiProviderSetup returnTo="companion" onConnected={setConnectedProvider} /></section>;

  return <section className="chat-panel" aria-busy={loading}><div className="companion-toolbar"><span><MessageCircle aria-hidden="true" />Using {providerName(connectedProvider)}</span><Link href="/app/settings"><Settings aria-hidden="true" />Manage connection</Link></div><div className="chat-history">{messages.length ? messages.map((message) => <article key={message.id} className={`chat-message ${message.role}`}><span>{message.role === 'assistant' ? 'SizoCare' : 'You'}</span><p>{message.content}</p></article>) : <div className="empty-state companion-empty"><MessageCircle aria-hidden="true" /><h2>Start with what is happening today</h2><p>Ask for communication ideas, ways to organise observations, or questions to take to a clinician.</p><div className="prompt-examples"><span>Try asking:</span><button type="button" onClick={() => { const input = document.querySelector<HTMLTextAreaElement>('#companion-message'); if (input) { input.value = 'Help me prepare calm questions for our next appointment.'; input.focus(); } }}>Prepare questions for an appointment</button><button type="button" onClick={() => { const input = document.querySelector<HTMLTextAreaElement>('#companion-message'); if (input) { input.value = 'Help me think through a difficult conversation without escalating it.'; input.focus(); } }}>Think through a difficult conversation</button></div></div>}</div>{loading ? <p className="thinking-status" role="status">Companion is considering your question...</p> : null}{error ? <p className="form-message error companion-error" role="alert">{error}</p> : null}<form className="chat-composer" onSubmit={send}><label htmlFor="companion-message">Ask Companion</label><textarea id="companion-message" name="content" required maxLength={8000} rows={4} placeholder="For example: Help me prepare three calm questions for tomorrow's appointment." disabled={loading} /><button className="primary-action" disabled={loading}><Send aria-hidden="true" />{loading ? 'Thinking...' : 'Send message'}</button></form></section>;
}
