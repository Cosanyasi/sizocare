import Link from 'next/link';
import { Settings } from 'lucide-react';
import { AppNav } from './app-nav';
import { HelpNow } from './help-now';
import { SignOutButton } from './sign-out-button';

export function AppShell({ recipientName, relationship, children }: { recipientName: string; relationship?: string | null; children: React.ReactNode }) {
  return (
    <div className="product-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="app-sidebar">
        <Link className="wordmark" href="/app/companion">SizoCare</Link>
        <div className="recipient-chip"><span>Care space for</span><strong>{recipientName}</strong>{relationship ? <small>Your {relationship.toLowerCase()}</small> : null}</div>
        <AppNav />
        <div className="sidebar-footer"><HelpNow /><SignOutButton /></div>
      </aside>
      <header className="mobile-app-header"><Link className="wordmark" href="/app/companion">SizoCare</Link><span>{recipientName}</span><div className="mobile-header-actions"><Link className="mobile-settings" href="/app/settings" aria-label="Settings"><Settings aria-hidden="true" /></Link><HelpNow /></div></header>
      <main id="main-content" className="app-main">{children}</main>
    </div>
  );
}
