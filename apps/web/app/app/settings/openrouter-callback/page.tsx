import { Suspense } from 'react';
import { OpenRouterCallbackClient } from '../../companion/openrouter-callback/callback-client';

export default function OpenRouterSettingsCallbackPage() {
  return <Suspense fallback={<div className="coming-soon"><h1>Connecting OpenRouter</h1><p>Completing the secure connection...</p></div>}><OpenRouterCallbackClient /></Suspense>;
}
