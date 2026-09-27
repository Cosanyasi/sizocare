import { z } from 'zod';
import * as enums from './enums';

export const CaregiverSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CareRecipientSchema = z.object({
  id: z.string().uuid(),
  caregiver_id: z.string().uuid(),
  name: z.string(),
  date_of_birth: z.string().optional(),
  relationship: z.string(),
  status: enums.CareRecipientStatusEnum,
  created_at: z.date(),
  updated_at: z.date(),
});

export const DailyLogSchema = z.object({
  id: z.string().uuid(),
  care_recipient_id: z.string().uuid(),
  category: enums.LogCategoryEnum,
  content: z.string(),
  severity_score: z.number().min(1).max(5).optional(),
  status: enums.DailyLogStatusEnum,
  observed_at: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const MedicationSchema = z.object({
  id: z.string().uuid(),
  care_recipient_id: z.string().uuid(),
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  status: enums.MedicationStatusEnum,
  created_at: z.date(),
  updated_at: z.date(),
});

// Other canonical entities...
// Add as needed to cover all 13 canonical entities
