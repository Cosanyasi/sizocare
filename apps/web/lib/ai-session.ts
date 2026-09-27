'use client';

export type AiProvider = 'openrouter' | 'google' | 'openai';

export type AiSession = { provider: AiProvider | null; secret: string | null; model: string | null };

const providerKey = 'sizocare.ai.provider';
const secretKey = 'sizocare.ai.secret';
const modelKey = 'sizocare.ai.model';
const ownerKey = 'sizocare.ai.owner';
const returnKey = 'sizocare.openrouter.return';
const providers: AiProvider[] = ['openrouter', 'google', 'openai'];

export function getAiSession(userId?: string): AiSession {
  const provider = sessionStorage.getItem(providerKey);
  const secret = sessionStorage.getItem(secretKey);
  const owner = sessionStorage.getItem(ownerKey);
  if (!provider || !providers.includes(provider as AiProvider) || !secret || (userId && owner !== userId)) {
    if (provider || secret || owner) clearAiSession();
    return { provider: null, secret: null, model: null };
  }
  return {
    provider: provider as AiProvider,
    secret,
    model: sessionStorage.getItem(modelKey),
  };
}

export function setAiSession(provider: AiProvider, secret: string, userId?: string, model?: string) {
  sessionStorage.setItem(providerKey, provider);
  sessionStorage.setItem(secretKey, secret);
  if (userId) sessionStorage.setItem(ownerKey, userId);
  if (model) sessionStorage.setItem(modelKey, model);
  else sessionStorage.removeItem(modelKey);
}

export function clearAiSession() {
  sessionStorage.removeItem(providerKey);
  sessionStorage.removeItem(secretKey);
  sessionStorage.removeItem(modelKey);
  sessionStorage.removeItem(ownerKey);
  sessionStorage.removeItem('sizocare.openrouter.verifier');
  sessionStorage.removeItem(returnKey);
}

export async function beginOpenRouterOAuth(returnTo: 'companion' | 'settings') {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = btoa(String.fromCharCode(...Array.from(verifierBytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...Array.from(new Uint8Array(digest)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  sessionStorage.setItem('sizocare.openrouter.verifier', verifier);
  sessionStorage.setItem(returnKey, returnTo);
  const callback = `${window.location.origin}/app/settings/openrouter-callback`;
  window.location.assign(`https://openrouter.ai/auth?callback_url=${encodeURIComponent(callback)}&code_challenge=${challenge}&code_challenge_method=S256&key_label=SizoCare`);
}

export function getOpenRouterReturnPath() {
  return sessionStorage.getItem(returnKey) === 'companion' ? '/app/companion' : '/app/settings';
}
