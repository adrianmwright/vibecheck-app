import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const headers={'Access-Control-Allow-Origin':'https://vibecheck-adrian-preview.adrianmwright.chatgpt.site','Access-Control-Allow-Headers':'content-type,apikey','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
 const text=await req.text();if(text.length>2048)return reply({error:'Request too large'},413);
 let b;try{b=JSON.parse(text);}catch{return reply({error:'Invalid request'},400);}
 if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.guest_token!=='string'||!/^\w{64}$/.test(b.guest_token)||!['status','submit'].includes(b.action))return reply({error:'Invalid guest request'},400);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.guest_token));
 const key=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(b.action==='status'){const {data,error}=await admin.from('guest_trials').select('used').eq('guest_key',key).maybeSingle();if(error)return reply({error:'Guest checks unavailable'},503);return reply({remaining:3-(data?.used||0)});}
 if(Object.keys(b).some(k=>!['action','guest_token','venue_id','crowd_level','social_vibe','energy_level'].includes(k))||typeof b.venue_id!=='string'||b.venue_id.length>64||!['Quiet','Lively','Packed'].includes(b.crowd_level)||!Number.isInteger(b.social_vibe)||b.social_vibe<1||b.social_vibe>10||!Number.isInteger(b.energy_level)||b.energy_level<1||b.energy_level>10)return reply({error:'Choose crowd and scores from 1 to 10'},400);
 const {data,error}=await admin.rpc('submit_guest_vibe',{p_guest_key:key,p_venue_id:b.venue_id,p_crowd_level:b.crowd_level,p_social_vibe:b.social_vibe,p_energy_level:b.energy_level});
 if(error){if(error.message.includes('GUEST_LIMIT'))return reply({error:'Your 3 guest checks are used. Sign in to keep contributing.',code:'GUEST_LIMIT'},403);if(error.message.includes('COOLDOWN'))return reply({error:'Thanks for checking in. Your next guest rating is available after 15 minutes.'},429);if(error.message.includes('VENUE_UNAVAILABLE'))return reply({error:'Venue unavailable'},400);return reply({error:'Could not save. Please try again.'},503);}
 return reply({saved:true,remaining:data},201);
 }catch{return reply({error:'Please try again'},503);}
});