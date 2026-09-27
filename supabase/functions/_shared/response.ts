import { corsHeaders } from './cors.ts';

export function successResponse(data: any, status = 200) {
  return new Response(JSON.stringify({ data, error: null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

export function errorResponse(error: any, status = 400) {
  return new Response(JSON.stringify({ data: null, error }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
