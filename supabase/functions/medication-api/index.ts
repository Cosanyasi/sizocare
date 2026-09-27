import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { verifyAuth } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await verifyAuth(req);
    // TODO: Implement Medication API logic (tracking doses, etc.)
    return successResponse({ message: `Medication API stub reached by ${user.id}` });
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Error', 401);
  }
});
