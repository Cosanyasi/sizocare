import { z } from 'zod';
import { LogCategoryEnum, MedicationEventStatusEnum, CaseFactTypeEnum } from './enums';

const notInFuture = (value: string) => new Date(value).getTime() <= Date.now();

export const createCompanionMessageRequestSchema = z.object({
  content: z.string().trim().min(1).max(8000),
});

export const createCaseFactRequestSchema = z.object({
  fact_type: CaseFactTypeEnum,
  fact_category: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(4000),
});

export const createDocumentRequestSchema = z.object({
  storage_path: z.string().trim().min(1).max(1024),
  file_type: z.enum(['pdf', 'docx', 'jpg', 'png']),
  size_bytes: z.number().int().positive().max(26214400),
  consent_id: z.string().uuid(),
});

export const patientDocumentUploadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]),
  size: z.number().int().positive().max(26214400),
});

export const featureWaitlistRequestSchema = z.object({
  feature: z.enum(['chatgpt_login', 'private_hosted_llm']),
  email: z.string().trim().toLowerCase().email().max(320),
});

export const createDailyLogRequestSchema = z.object({
  category: LogCategoryEnum,
  intensity_rating: z.number().int().min(1).max(5).optional(),
  free_text: z.string().trim().max(2000).optional(),
  observed_at: z
    .string()
    .datetime()
    .refine(notInFuture, 'Observation time cannot be in the future'),
});

export const createMedicationEventRequestSchema = z.object({
  status: MedicationEventStatusEnum,
  occurred_at: z.string().datetime().refine(notInFuture, 'Event time cannot be in the future'),
  side_effect_note: z.string().trim().max(1000).optional(),
});

export const PostSummaryRequestSchema = z.object({
  period_start: z.string().date(),
  period_end: z.string().date(),
});

export const acknowledgeDisclaimerRequestSchema = z.object({
  is_adult: z.literal(true),
  is_family_or_trusted_supporter: z.literal(true),
});

export const completeCaseProfileRequestSchema = z.object({
  preferred_name: z.string().trim().min(1).max(100),
  relationship: z.string().trim().min(1).max(100),
  age_band: z.string().trim().min(1).max(50),
  diagnosis_summary: z.string().trim().max(1000).optional(),
  story: z.string().trim().min(1),
});

export const createMedicationRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  schedule: z.string().trim().min(1).max(500),
  start_date: z.string().date(),
});

export const PostMessageRequestSchema = createCompanionMessageRequestSchema;
export const PostCaseFactRequestSchema = createCaseFactRequestSchema;
export const PostDocumentRequestSchema = createDocumentRequestSchema;
export const PostLogRequestSchema = createDailyLogRequestSchema;
export const PostMedicationEventRequestSchema = createMedicationEventRequestSchema;
