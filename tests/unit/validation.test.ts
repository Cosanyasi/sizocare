/**
 * Validation schema tests: Verify Zod schemas enforce the correct constraints
 * per Data/API Spec §6 entity definitions.
 *
 * Requirements: Phase 0 foundation + PRD FR-LOG (category taxonomy), FR-MED, FR-CASE
 */
import { describe, it, expect } from 'vitest';

describe('Validation Schemas', () => {
  it('daily log schema rejects future observed_at dates', async () => {
    const { createDailyLogRequestSchema } = await import('@sizocare/validation');

    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const result = createDailyLogRequestSchema.safeParse({
      category: 'mood',
      intensity_rating: 3,
      observed_at: futureDate,
    });

    // PRD FR-LOG error case: "You can't log something that hasn't happened yet."
    expect(result.success).toBe(false);
  });

  it('daily log schema accepts valid entries with only required fields', async () => {
    const { createDailyLogRequestSchema } = await import('@sizocare/validation');

    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const result = createDailyLogRequestSchema.safeParse({
      category: 'mood',
      observed_at: pastDate,
    });

    // FR-LOG-001: under 30 seconds using at least one category, without requiring every field
    expect(result.success).toBe(true);
  });

  it('daily log schema rejects invalid categories', async () => {
    const { createDailyLogRequestSchema } = await import('@sizocare/validation');

    const result = createDailyLogRequestSchema.safeParse({
      category: 'invented_category',
      observed_at: new Date().toISOString(),
    });

    // PRD FR-LOG BR3: category taxonomy is fixed in MVP
    expect(result.success).toBe(false);
  });

  it('case fact content must be 1-4000 chars', async () => {
    const { createCaseFactRequestSchema } = await import('@sizocare/validation');

    // Empty content — rejected
    const empty = createCaseFactRequestSchema.safeParse({
      fact_type: 'story_narrative',
      fact_category: 'background',
      content: '',
    });
    expect(empty.success).toBe(false);

    // Over 4000 chars — rejected
    const tooLong = createCaseFactRequestSchema.safeParse({
      fact_type: 'story_narrative',
      fact_category: 'background',
      content: 'x'.repeat(4001),
    });
    expect(tooLong.success).toBe(false);

    // Valid content — accepted
    const valid = createCaseFactRequestSchema.safeParse({
      fact_type: 'story_narrative',
      fact_category: 'background',
      content: 'She was diagnosed in 2019 after a period of increasing suspiciousness.',
    });
    expect(valid.success).toBe(true);
  });

  it('medication event status must be taken, missed, or unknown', async () => {
    const { createMedicationEventRequestSchema } = await import('@sizocare/validation');

    const valid = createMedicationEventRequestSchema.safeParse({
      status: 'taken',
      occurred_at: new Date().toISOString(),
    });
    expect(valid.success).toBe(true);

    const invalid = createMedicationEventRequestSchema.safeParse({
      status: 'skipped',
      occurred_at: new Date().toISOString(),
    });
    expect(invalid.success).toBe(false);
  });

  it('companion message content must be 1-8000 chars', async () => {
    const { createCompanionMessageRequestSchema } = await import('@sizocare/validation');

    const empty = createCompanionMessageRequestSchema.safeParse({ content: '' });
    expect(empty.success).toBe(false);

    const tooLong = createCompanionMessageRequestSchema.safeParse({
      content: 'x'.repeat(8001),
    });
    expect(tooLong.success).toBe(false);

    const valid = createCompanionMessageRequestSchema.safeParse({
      content: 'She said the neighbors are watching her again. How should I respond?',
    });
    expect(valid.success).toBe(true);
  });

  it('document upload rejects files over 25MB', async () => {
    const { createDocumentRequestSchema } = await import('@sizocare/validation');

    const tooLarge = createDocumentRequestSchema.safeParse({
      storage_path: 'documents/test.pdf',
      file_type: 'pdf',
      size_bytes: 26214401, // > 25MB
      consent_id: '5c1f6e2a-3b4d-4e9a-8f21-0a6c5d9e7b1f',
    });
    expect(tooLarge.success).toBe(false);
  });

  it('document upload rejects unsupported file types', async () => {
    const { createDocumentRequestSchema } = await import('@sizocare/validation');

    const invalidType = createDocumentRequestSchema.safeParse({
      storage_path: 'documents/test.exe',
      file_type: 'exe',
      size_bytes: 1024,
      consent_id: '5c1f6e2a-3b4d-4e9a-8f21-0a6c5d9e7b1f',
    });
    expect(invalidType.success).toBe(false);
  });
});
