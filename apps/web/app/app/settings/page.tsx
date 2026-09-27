import { AiSettings } from './ai-settings';
import { getAuthenticatedContext } from '@/lib/app-data';

export default async function SettingsPage() {
  const { supabase } = await getAuthenticatedContext({ requireActive: true });
  const { data: consent } = await supabase.from('consent_records').select('id').eq('consent_type', 'ai_processing').is('revoked_at', null).maybeSingle();
  return (
    <div className="page-stack narrow-page">
      <header className="page-heading">
        <h1>Connections and privacy.</h1>
        <span>Review or change the provider Companion uses in this browser tab.</span>
      </header>
      <AiSettings hasConsent={Boolean(consent)} />
    </div>
  );
}
