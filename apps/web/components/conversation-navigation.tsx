'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type ConversationSummary = { id: string; title: string | null; updated_at: string | null };

export function ConversationNavigation({ conversations, mobile = false, listOnly = false }: { conversations: ConversationSummary[]; mobile?: boolean; listOnly?: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const results = conversations.filter((item) => (item.title ?? 'Untitled conversation').toLowerCase().includes(query.trim().toLowerCase()));

  function openSearch() { dialogRef.current?.showModal(); requestAnimationFrame(() => searchRef.current?.focus()); }
  function closeSearch() { dialogRef.current?.close(); setQuery(''); }
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    };
    if (!mobile && !listOnly) window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [mobile, listOnly]);

  async function newChat() {
    setBusy(true);
    const { error } = await createClient().rpc('start_new_conversation');
    setBusy(false);
    if (!error) { closeSearch(); router.push('/app/companion'); router.refresh(); }
  }

  if (mobile) return <>
    <button type="button" className="mobile-new-chat" onClick={newChat} disabled={busy} aria-label="Start a new chat"><MessageSquarePlus aria-hidden="true" /></button>
    <button type="button" className="mobile-search" onClick={openSearch} aria-label="Search conversations"><Search aria-hidden="true" /></button>
    <SearchDialog />
  </>;

  function SearchDialog() {
    return <dialog ref={dialogRef} className="search-dialog" aria-labelledby="conversation-search-title" onClose={() => setQuery('')}>
      <div className="search-dialog-inner"><div className="search-dialog-heading"><h2 id="conversation-search-title">Search conversations</h2><button type="button" onClick={closeSearch} aria-label="Close conversation search"><X aria-hidden="true" /></button></div>
      <label className="conversation-search"><Search aria-hidden="true" /><span className="sr-only">Search conversation titles</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversation titles" /></label>
      <div className="search-results">{results.length ? results.map((item) => <Link key={item.id} href={`/app/companion?conversation=${item.id}`} onClick={closeSearch}>{item.title || 'Untitled conversation'}<small>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}</small></Link>) : <p role="status">{conversations.length ? 'No conversations match your search.' : 'No conversations yet. Start a new chat when you are ready.'}</p>}</div></div>
    </dialog>;
  }

  if (listOnly) return <div className="conversation-list" aria-label="Recent conversations"><p>Conversations</p>{conversations.length ? conversations.slice(0, 8).map((item) => <Link key={item.id} href={`/app/companion?conversation=${item.id}`}>{item.title || 'Untitled conversation'}</Link>) : <span>No conversations yet</span>}</div>;

  return <div className="conversation-navigation">
    <button type="button" className="new-chat-action" onClick={newChat} disabled={busy}><MessageSquarePlus aria-hidden="true" />{busy ? 'Starting…' : 'New chat'}</button>
    <button type="button" className="conversation-search-trigger" onClick={openSearch}><Search aria-hidden="true" /><span>Search conversations</span><kbd>⌘/Ctrl K</kbd></button>
    <SearchDialog />
  </div>;
}
