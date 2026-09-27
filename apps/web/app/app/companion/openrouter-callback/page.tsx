import { Suspense } from 'react';
import { OpenRouterCallbackClient } from './callback-client';

export default function OpenRouterCallbackPage() {
  return <Suspense fallback={<p>Connecting OpenRouter...</p>}><OpenRouterCallbackClient /></Suspense>;
}
