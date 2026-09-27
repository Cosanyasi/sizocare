'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOpenRouterReturnPath, setAiSession } from '@/lib/ai-session';
import { createClient } from '@/lib/supabase/client';

let exchangeStarted = false;

export function OpenRouterCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (exchangeStarted) return;
    exchangeStarted = true;
    const code = params.get('code');
    const verifier = sessionStorage.getItem('sizocare.openrouter.verifier');
    if (!code || !verifier) { setError('The OpenRouter connection expired. Start again from Companion.'); return; }
    fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('exchange failed');
      const payload = await response.json();
      if (!payload.key) throw new Error('key missing');
       const { data } = await createClient().auth.getUser();
       if (!data.user) throw new Error('user missing');
       setAiSession('openrouter', payload.key, data.user.id);
       const returnPath = getOpenRouterReturnPath();
       sessionStorage.removeItem('sizocare.openrouter.verifier');
       router.replace(returnPath);
    }).catch(() => {
      sessionStorage.removeItem('sizocare.openrouter.verifier');
      window.history.replaceState({}, '', window.location.pathname);
      setError('OpenRouter could not be connected. No key was saved.');
    });
  }, [params, router]);

  return <div className="coming-soon"><h1>Connecting OpenRouter</h1><p>{error ?? 'Completing the connection for this browser session...'}</p>{error ? <button className="small-action" onClick={() => router.replace(getOpenRouterReturnPath())}>Return</button> : null}</div>;
}
