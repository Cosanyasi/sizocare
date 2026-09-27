import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(resolve('supabase/migrations/00009_secure_acknowledgements_documents_waitlist.sql'), 'utf8');

describe('secure database contracts', () => {
  it('derives acknowledgement and upload ownership from auth.uid()', () => {
    expect(migration).toContain('account_id UUID := auth.uid()');
    expect(migration).not.toMatch(/acknowledge_disclaimer\([^)]*user_id/i);
    expect(migration).not.toMatch(/reserve_document_upload\([^)]*caregiver_id/i);
  });

  it('keeps patient files private and scoped to the owner folder', () => {
    expect(migration).toContain("'patient-documents', 'patient-documents', false");
    expect(migration).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it('does not expose collected waitlist addresses to authenticated clients', () => {
    expect(migration).toContain('REVOKE ALL ON TABLE public.feature_waitlist FROM anon, authenticated');
    expect(migration).toContain('ON CONFLICT DO NOTHING');
  });
});
