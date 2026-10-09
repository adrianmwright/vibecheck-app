import { createClient } from 'npm:@supabase/supabase-js@2.95.0';

const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const cors = {
  'Access-Control-Allow-Origin': '*', // The response is deliberately public aggregate data.
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json', 'Cache-Control': 'no-store'
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

// Platform JWT check is off because GET is public. Every POST independently
// validates a real, confirmed user with Supabase Auth; an API key is insufficient.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.from('venue_stats').select(
        'venue_id,name,suburb,category,submission_count,avg_social_vibe,avg_energy_level,current_crowd_level,last_report_at'
      ).order('name');
      if (error) return reply({ error: 'Venue snapshots are temporarily unavailable.' }, 503);
      return reply({ venues: data, generated_at: new Date().toISOString(), window_minutes: 60, minimum_reports: 3 });
    }
    if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
    const header = req.headers.get('Authorization') || '';
    if (!/^Bearer \S+$/i.test(header)) return reply({ error: 'Sign in to drop a vibe check.' }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(header.slice(7));
    if (authError || !user || !user.email_confirmed_at || user.is_anonymous) {
      return reply({ error: 'Please sign in with a confirmed email account.' }, 401);
    }
    if (!req.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'JSON required.' }, 415);
    const text = await req.text();
    if (text.length > 2048) return reply({ error: 'Report is too large.' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid report.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(k => !['venue_id','crowd_level','social_vibe','energy_level'].includes(k)) ||
      typeof body.venue_id !== 'string' || body.venue_id.length > 64 ||
      !['Quiet','Lively','Packed'].includes(body.crowd_level) ||
      !Number.isInteger(body.social_vibe) || body.social_vibe < 1 || body.social_vibe > 10 ||
      !Number.isInteger(body.energy_level) || body.energy_level < 1 || body.energy_level > 10) {
      return reply({ error: 'Choose the crowd and whole-number scores from 1 to 10.' }, 400);
    }
    const { error } = await admin.rpc('submit_atmosphere_report', {
      p_submitter_id: user.id, p_venue_id: body.venue_id, p_crowd_level: body.crowd_level,
      p_social_vibe: body.social_vibe, p_energy_level: body.energy_level
    });
    if (error) {
      if (error.message.includes('COOLDOWN')) return reply({ error: 'You have already checked this venue. Try again after 15 minutes.' }, 429);
      if (error.message.includes('HOURLY_LIMIT')) return reply({ error: 'You have reached the hourly limit. Try again later.' }, 429);
      if (error.message.includes('VENUE_UNAVAILABLE')) return reply({ error: 'This venue is unavailable.' }, 400);
      return reply({ error: 'Your vibe check could not be saved. Please try again.' }, 503);
    }
    return reply({ saved: true }, 201); // No raw report, user ID, or privileged details returned.
  } catch {
    return reply({ error: 'Something went wrong. Please try again.' }, 503);
  }
});
