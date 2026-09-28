'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { acknowledgeDisclaimerRequestSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';
import { copy } from '@/lib/copy';

type Mode = 'signup' | 'login';

function safeAuthMessage(message: string) {
  if (message.toLowerCase().includes('invalid login'))
    return 'The email or password did not match.';
  if (message.toLowerCase().includes('already registered'))
    return 'An account already exists for this email.';
  if (message.toLowerCase().includes('password'))
    return 'Use a password with at least 8 characters.';
  return 'We could not complete that request. Check your connection and try again.';
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signup');
  const [isAdult, setIsAdult] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function handleGoogle() {
    setError(undefined);
    setIsLoading(true);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (oauthError) {
      setError('Google sign-in could not start. Try another sign-in method.');
      setIsLoading(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);

    if (!navigator.onLine) {
      setError('You are offline. Reconnect before signing in.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const eligibility = acknowledgeDisclaimerRequestSchema.safeParse({
      is_adult: isAdult,
      is_family_or_trusted_supporter: isSupporter,
    });

    if (mode === 'signup' && !eligibility.success) {
      setError('Confirm both eligibility statements before creating an account.');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Use a password with at least 8 characters. No special characters are required.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const result =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(safeAuthMessage(result.error.message));
      setIsLoading(false);
      return;
    }

    if (!result.data.session) {
      setNotice('Check your email to confirm your account, then return here to sign in.');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error: disclaimerError } = await supabase.rpc('acknowledge_disclaimer', {
        p_is_adult: true,
        p_is_family_or_trusted_supporter: true,
      });
      if (disclaimerError) {
        await supabase.auth.signOut();
        setError(
          'Your account was created, but the acknowledgment was not saved. Sign in to try again.',
        );
        setIsLoading(false);
        return;
      }
    }

    router.push('/');
    router.refresh();
  }

  async function handleMagicLink(event: FormEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const email = String(new FormData(form ?? undefined).get('email') ?? '');
    setError(undefined);
    setNotice(undefined);
    if (!email) {
      setError('Enter your email address first.');
      return;
    }

    setIsLoading(true);
    const { error: magicLinkError } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsLoading(false);
    if (magicLinkError) setError(safeAuthMessage(magicLinkError.message));
    else setNotice('A secure sign-in link is on its way. You can close this tab.');
  }

  return (
    <div className="auth-panel">
      <div className="auth-tabs" aria-label="Account access">
        {(['signup', 'login'] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            className="auth-tab"
            disabled={!hydrated}
            onClick={() => {
              setMode(item);
              setError(undefined);
              setNotice(undefined);
            }}
          >
            {item === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>

      <form onSubmit={handlePassword} className="auth-form">
        <button
          className="google-action"
          type="button"
          onClick={handleGoogle}
          disabled={isLoading || !hydrated}
        >
          <span aria-hidden="true">G</span>Continue with Google
        </button>
        <div className="auth-divider">
          <span>or use email</span>
        </div>
        <label>
          <span>{copy.auth.emailLabel}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            disabled={!hydrated}
          />
        </label>
        <label>
          <span>{copy.auth.passwordLabel}</span>
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              disabled={!hydrated}
              placeholder={
                mode === 'signup'
                  ? 'Create a password with at least 8 characters'
                  : 'Enter your password'
              }
              aria-describedby={mode === 'signup' ? 'password-help' : undefined}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </span>
          {mode === 'signup' ? (
            <small id="password-help">At least 8 characters. No special characters required.</small>
          ) : null}
        </label>

        {mode === 'signup' ? (
          <fieldset className="disclaimer">
            <legend>{copy.disclaimer.title}</legend>
            <p>{copy.disclaimer.body}</p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={isAdult}
                disabled={!hydrated}
                onChange={(event) => setIsAdult(event.target.checked)}
              />
              <span>{copy.disclaimer.adult}</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={isSupporter}
                disabled={!hydrated}
                onChange={(event) => setIsSupporter(event.target.checked)}
              />
              <span>{copy.disclaimer.supporter}</span>
            </label>
          </fieldset>
        ) : null}

        {error ? (
          <p className="form-message error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="form-message" role="status">
            {notice}
          </p>
        ) : null}
        <button className="primary-action" type="submit" disabled={isLoading || !hydrated}>
          {isLoading
            ? 'Please wait...'
            : mode === 'signup'
              ? 'Create my private space'
              : 'Sign in securely'}
        </button>
        <button
          className="text-action"
          type="button"
          onClick={handleMagicLink}
          disabled={isLoading || !hydrated}
        >
          Email me a magic link instead
        </button>
      </form>
    </div>
  );
}
