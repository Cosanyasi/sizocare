'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardPlus,
  Clock3,
  LayoutDashboard,
  MessagesSquare,
  Pill,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { ConversationNavigation, type ConversationSummary } from './conversation-navigation';

const primary = [
  { href: '/app/companion', label: 'Companion', icon: MessagesSquare },
  { href: '/app/log/new', label: 'Daily log', icon: ClipboardPlus },
  { href: '/app/timeline', label: 'Timeline', icon: Clock3 },
  { href: '/app/medications', label: 'Medications', icon: Pill },
];

const secondary = [
  { href: '/app/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/profile', label: 'Case profile', icon: UserRound },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const current = pathname.startsWith(href);
  return (
    <Link href={href} className="nav-link" aria-current={current ? 'page' : undefined}>
      <Icon aria-hidden="true" />
      {label}
    </Link>
  );
}

export function AppNav({ conversations }: { conversations: ConversationSummary[] }) {
  return (
    <>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <div>
          <ConversationNavigation conversations={conversations} />
          {primary.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <div className="nav-secondary">
            {secondary.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
          <ConversationNavigation conversations={conversations} listOnly />
        </div>
      </nav>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {primary.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </>
  );
}
