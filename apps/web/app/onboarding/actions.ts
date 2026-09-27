'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AcknowledgeDisclaimerResult =
  | { success: true }
  | { success: false; message: string };

export async function acknowledgeDisclaimer(): Promise<AcknowledgeDisclaimerResult> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { success: false, message: 'Your session expired. Sign in again to continue.' };
  }

  const { error } = await supabase.rpc('acknowledge_disclaimer', {
    p_is_adult: true,
    p_is_family_or_trusted_supporter: true,
  });

  if (error) {
    console.error('Failed to save disclaimer acknowledgment', {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });
    return { success: false, message: 'The acknowledgment could not be saved. Please try again.' };
  }

  revalidatePath('/onboarding');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth');
}
