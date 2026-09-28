'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { beginOpenRouterOAuth, setAiSession, type AiProvider } from '@/lib/ai-session';
import { createClient } from '@/lib/supabase/client';
import { FeatureWaitlistForm } from './feature-waitlist-form';

type Provider = {
  id: AiProvider;
  title: string;
  description: string;
  note: string;
  label: string;
  placeholder: string;
  hint: string;
};

export const aiProviders: Provider[] = [
  {
    id: 'google',
    title: 'Google Gemini',
    description: 'Connect directly with a Gemini API key from Google AI Studio.',
    note: 'Direct provider connection. Usage is billed by Google.',
    label: 'Gemini API key',
    placeholder: 'Paste your Gemini API key',
    hint: 'Usually begins with "AIza".',
  },
  {
    id: 'openai',
    title: 'OpenAI Platform',
    description: 'Connect with an API key from the OpenAI Platform.',
    note: 'Uses separate API billing. ChatGPT Plus or Pro can instead use Codex OAuth when that connection is enabled.',
    label: 'OpenAI Platform API key',
    placeholder: 'Paste your OpenAI API key',
    hint: 'Usually begins with "sk-".',
  },
  {
    id: 'openrouter',
    title: 'OpenRouter',
    description: 'Route Companion through OpenRouter to a supported AI model.',
    note: 'Least private: your request passes through OpenRouter and the model provider, adding another third party.',
    label: 'OpenRouter API key',
    placeholder: 'Paste your OpenRouter API key',
    hint: 'Usually begins with "sk-or-".',
  },
];

export function providerName(provider: AiProvider | null) {
  return aiProviders.find((item) => item.id === provider)?.title ?? 'AI provider';
}

export function AiProviderSetup({
  returnTo,
  onConnected,
}: {
  returnTo: 'companion' | 'settings';
  onConnected?: (provider: AiProvider) => void;
}) {
  const [provider, setProvider] = useState<AiProvider>('google');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [openRouterAccepted, setOpenRouterAccepted] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = aiProviders.find((item) => item.id === provider)!;

  useEffect(() => {
    setError(undefined);
    setNotice(undefined);
  }, [provider]);

  async function connectKey() {
    setError(undefined);
    setNotice(undefined);
    if (!navigator.onLine) {
      setError('You are offline. Reconnect before connecting a provider.');
      return;
    }
    if (provider === 'openrouter' && !openRouterAccepted) {
      setError('Confirm that you understand the additional data sharing to continue.');
      return;
    }
    if (!secret.trim()) {
      setError(`Enter your ${selected.title} API key.`);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data, error: requestError } = await supabase.functions.invoke('companion-api', {
      body: { action: 'validate_provider' },
      headers: { 'x-ai-provider': provider, 'x-ai-key': secret.trim() },
    });
    setLoading(false);
    if (requestError || !data?.data?.valid || !userData.user) {
      const context =
        requestError && typeof requestError === 'object' && 'context' in requestError
          ? (requestError as { context?: Response }).context
          : undefined;
      const payload = context ? await context.json().catch(() => null) : null;
      setError(
        payload?.error?.message ??
          'That key was not accepted. Check the key and its API billing, then try again.',
      );
      inputRef.current?.focus();
      return;
    }
    setAiSession(provider, secret.trim(), userData.user.id);
    setSecret('');
    setNotice(`${selected.title} is connected. You can now message Companion.`);
    onConnected?.(provider);
  }

  return (
    <div className="provider-setup">
      <div className="setup-intro">
        <ShieldCheck aria-hidden="true" />
        <div>
          <h2>Choose how Companion connects</h2>
          <p>
            Your API key stays in this browser tab and is removed when the tab closes. It passes
            through SizoCare&apos;s server for each request but is not intentionally stored.
          </p>
        </div>
      </div>
      <fieldset className="provider-fieldset">
        <legend>Choose an AI provider</legend>
        <div className="provider-options">
          {aiProviders.map((item) => (
            <label className={`provider-option provider-${item.id}`} key={item.id}>
              <input
                type="radio"
                name={`provider-${returnTo}`}
                checked={provider === item.id}
                onChange={() => setProvider(item.id)}
              />
              <span className="provider-copy">
                <span className="provider-title">
                  <KeyRound aria-hidden="true" />
                  <strong>{item.title}</strong>
                  {item.id === 'google' ? (
                    <small className="provider-badge">Recommended</small>
                  ) : item.id === 'openrouter' ? (
                    <small className="provider-badge caution">Least private</small>
                  ) : null}
                </span>
                <span>{item.description}</span>
                <small>{item.note}</small>
              </span>
            </label>
          ))}
          <div className="provider-option provider-coming-soon">
            <KeyRound aria-hidden="true" />
            <div className="provider-copy">
              <span className="provider-title">
                <strong>ChatGPT Login</strong>
                <small className="provider-badge">Coming Soon</small>
              </span>
              <span>
                Use eligible ChatGPT access through a future SizoCare-specific connection.
              </span>
              <small>
                Expressing interest gets you notified and helps us prioritise and ship it faster.
              </small>
              <FeatureWaitlistForm feature="chatgpt_login" label="ChatGPT Login" />
            </div>
          </div>
          <div className="provider-option provider-coming-soon">
            <LockKeyhole aria-hidden="true" />
            <div className="provider-copy">
              <span className="provider-title">
                <strong>More private hosted AI</strong>
                <small className="provider-badge">Coming Soon · Paid</small>
              </span>
              <span>
                A paid, first-party or self-hosted option designed to reduce third-party data
                sharing.
              </span>
              <small>
                Expressing interest gets you notified and helps motivate and prioritise faster
                shipping.
              </small>
              <FeatureWaitlistForm
                feature="private_hosted_llm"
                label="the more private hosted option"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <div className="provider-credentials">
        {provider === 'openrouter' ? (
          <label className="privacy-acknowledgment">
            <input
              type="checkbox"
              checked={openRouterAccepted}
              onChange={(event) => setOpenRouterAccepted(event.target.checked)}
            />
            <span>
              <TriangleAlert aria-hidden="true" />I understand that Companion data will pass through
              OpenRouter and another AI provider.
            </span>
          </label>
        ) : null}
        {provider === 'openrouter' ? (
          <>
            <button
              className="secondary-link"
              type="button"
              onClick={() => beginOpenRouterOAuth(returnTo)}
              disabled={loading || !openRouterAccepted}
            >
              <KeyRound aria-hidden="true" />
              Connect with OpenRouter
            </button>
            <div className="auth-divider">
              <span>or use an API key</span>
            </div>
          </>
        ) : null}
        <label className="key-field" htmlFor={`provider-key-${returnTo}`}>
          <span>{selected.label}</span>
          <span className="password-field">
            <input
              ref={inputRef}
              id={`provider-key-${returnTo}`}
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              type={showSecret ? 'text' : 'password'}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={selected.placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={`provider-key-help-${returnTo}`}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowSecret((visible) => !visible)}
              aria-label={showSecret ? 'Hide API key' : 'Show API key'}
              aria-pressed={showSecret}
            >
              {showSecret ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </span>
          <small id={`provider-key-help-${returnTo}`}>
            {selected.hint} Kept only in this browser tab.
          </small>
        </label>
        <button className="primary-action" type="button" onClick={connectKey} disabled={loading}>
          {loading ? 'Checking connection...' : `Connect ${selected.title}`}
        </button>
      </div>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="form-message connection-notice" role="status">
          <CheckCircle2 aria-hidden="true" />
          {notice}
        </p>
      ) : null}
    </div>
  );
}
