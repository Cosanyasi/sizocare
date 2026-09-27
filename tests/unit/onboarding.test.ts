import { describe, expect, it } from 'vitest';
import { acknowledgeDisclaimerRequestSchema, completeCaseProfileRequestSchema, createMedicationRequestSchema } from '@sizocare/validation';

describe('onboarding disclaimer', () => {
  it('requires both adult and trusted-supporter attestations', () => {
    expect(acknowledgeDisclaimerRequestSchema.safeParse({ is_adult: true, is_family_or_trusted_supporter: false }).success).toBe(false);
  });

  it('accepts only an explicit acknowledgment', () => {
    expect(acknowledgeDisclaimerRequestSchema.safeParse({ is_adult: true, is_family_or_trusted_supporter: true }).success).toBe(true);
  });

  it('requires meaningful case context before activation', () => {
    expect(completeCaseProfileRequestSchema.safeParse({ preferred_name: 'Priya', relationship: 'Sister', age_band: '25-34', story: '' }).success).toBe(false);
  });

  it('accepts a long caregiver story without an arbitrary character limit', () => {
    expect(completeCaseProfileRequestSchema.safeParse({ preferred_name: 'Priya', relationship: 'Sister', age_band: '25-34', story: 'context '.repeat(2000) }).success).toBe(true);
  });

  it('accepts a caregiver-entered medication without prescribing fields', () => {
    expect(createMedicationRequestSchema.safeParse({ name: 'Medication A', schedule: 'As directed each evening', start_date: '2026-09-01' }).success).toBe(true);
  });
});
