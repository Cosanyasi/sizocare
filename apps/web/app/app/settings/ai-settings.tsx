'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Unplug } from 'lucide-react';
import { AiProviderSetup, providerName } from '@/components/ai-provider-setup';
import { clearAiSession, getAiSession, type AiProvider } from '@/lib/ai-session';
import { createClient } from '@/lib/supabase/client';

export function AiSettings({ hasConsent }: { hasConsent: boolean }) {
  const [connectedProvider, setConnectedProvider] = useState<AiProvider | null>(null);
  const [notice, setNotice] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [changing, setChanging] = useState(false);
  const [consentActive, setConsentActive] = useState(hasConsent);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setConnectedProvider(getAiSession(data.user?.id).provider);
      setHydrated(true);
    });
  }, []);

  function disconnect() {
    clearAiSession();
    setConnectedProvider(null);
    setNotice('The AI provider was disconnected and its session key was removed.');
  }

  async function revokeConsent() {
    const { error } = await createClient().rpc('revoke_ai_processing_consent');
    if (error) setNotice('AI consent could not be revoked. Try again.');
    else {
      setConsentActive(false);
      setNotice('AI processing consent was revoked. Companion will ask before sharing information again.');
    }
  }

  return (
    <section className="settings-section" aria-labelledby="ai-settings-title">
      <div className="section-heading">
        <div><p>Companion</p><h2 id="ai-settings-title">AI provider</h2></div>
        {connectedProvider ? <span className="connection-status"><CheckCircle2 aria-hidden="true" />Connected</span> : null}
      </div>
      {connectedProvider && !changing ? (
        <div className="connected-provider">
          <div><strong>{providerName(connectedProvider)}</strong><p>Connected for this browser tab. The credential is removed when the tab closes or you sign out.</p></div>
          <div className="connection-actions"><button className="small-action" type="button" onClick={() => setChanging(true)}>Change provider</button><button className="text-action revoke-action" type="button" onClick={disconnect}><Unplug aria-hidden="true" />Disconnect</button></div>
        </div>
      ) : (
        hydrated ? <AiProviderSetup returnTo="settings" onConnected={(provider) => { setConnectedProvider(provider); setChanging(false); }} /> : <p className="muted-copy">Checking this browser tab for an existing connection...</p>
      )}
      {notice ? <p className="form-message" role="status">{notice}</p> : null}
      <div className="privacy-setting"><div><strong>AI processing consent</strong><p>{consentActive ? 'Active. Companion may share the disclosed care context with your connected provider when you send a message.' : 'Not active. Companion will ask for consent before any care context is shared.'}</p></div>{consentActive ? <button className="text-action revoke-action" type="button" onClick={revokeConsent}>Revoke consent</button> : null}</div>
    </section>
  );
}
