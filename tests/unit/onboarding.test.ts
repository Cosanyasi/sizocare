import { describe, expect, it } from 'vitest';
import { acknowledgeDisclaimerRequestSchema, completeCaseProfileRequestSchema, createMedicationRequestSchema, featureWaitlistRequestSchema, patientDocumentUploadSchema } from '@sizocare/validation';

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

describe('sensitive intake validation', () => {
  it('accepts supported documents within 25 MB and rejects executable content', () => {
    expect(patientDocumentUploadSchema.safeParse({ name: 'care-plan.pdf', type: 'application/pdf', size: 1024 }).success).toBe(true);
    expect(patientDocumentUploadSchema.safeParse({ name: 'malware.exe', type: 'application/x-msdownload', size: 1024 }).success).toBe(false);
    expect(patientDocumentUploadSchema.safeParse({ name: 'large.pdf', type: 'application/pdf', size: 26214401 }).success).toBe(false);
  });

  it('normalizes valid waitlist emails and rejects invalid addresses', () => {
    const valid = featureWaitlistRequestSchema.parse({ feature: 'chatgpt_login', email: ' Caregiver@Example.com ' });
    expect(valid.email).toBe('caregiver@example.com');
    expect(featureWaitlistRequestSchema.safeParse({ feature: 'private_hosted_llm', email: 'not-an-email' }).success).toBe(false);
  });
});
