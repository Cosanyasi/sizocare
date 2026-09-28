'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { acknowledgeDisclaimerRequestSchema } from '@sizocare/validation';

export type AcknowledgeDisclaimerResult = { success: true } | { success: false; message: string };

export async function acknowledgeDisclaimer(input: {
  is_adult: boolean;
  is_family_or_trusted_supporter: boolean;
}): Promise<AcknowledgeDisclaimerResult> {
  const eligibility = acknowledgeDisclaimerRequestSchema.safeParse(input);
  if (!eligibility.success)
    return { success: false, message: 'Confirm both statements to continue.' };
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { success: false, message: 'Your session expired. Sign in again to continue.' };
  }

  const { error } = await supabase.rpc('acknowledge_disclaimer', {
    p_is_adult: eligibility.data.is_adult,
    p_is_family_or_trusted_supporter: eligibility.data.is_family_or_trusted_supporter,
  });

  if (error) {
    const diagnosticId = crypto.randomUUID();
    console.error('Failed to save disclaimer acknowledgment', {
      diagnosticId,
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });
    return {
      success: false,
      message: `The acknowledgment could not be saved. Please try again. Reference: ${diagnosticId.slice(0, 8)}`,
    };
  }

  revalidatePath('/onboarding');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth');
}
