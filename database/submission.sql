-- Server-only RPC. The Edge Function supplies the verified Auth user ID.
-- Invoker privileges prevent browser roles from reading or writing raw reports.
create or replace function public.submit_atmosphere_report(
  p_submitter_id uuid, p_venue_id text, p_crowd_level text,
  p_social_vibe integer, p_energy_level integer
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare report_id uuid;
begin
  if p_submitter_id is null then
    raise exception 'SIGN_IN_REQUIRED' using errcode='P0001';
  end if;
  if p_crowd_level is null or p_crowd_level not in ('Quiet','Lively','Packed')
     or p_social_vibe is null or p_social_vibe not between 1 and 10
     or p_energy_level is null or p_energy_level not between 1 and 10 then
    raise exception 'INVALID_REPORT' using errcode='P0001';
  end if;
  if not exists(select 1 from public.venues where id=p_venue_id and is_active) then
    raise exception 'VENUE_UNAVAILABLE' using errcode='P0001';
  end if;
  -- Serialise concurrent submissions by this user; refresh/reset cannot bypass it.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_submitter_id::text,0));
  if exists(select 1 from public.atmosphere_reports where submitter_id=p_submitter_id
    and venue_id=p_venue_id and not is_demo and created_at > pg_catalog.clock_timestamp()-interval '15 minutes') then
    raise exception 'COOLDOWN' using errcode='P0001';
  end if;
  if (select count(*) from public.atmosphere_reports where submitter_id=p_submitter_id
    and not is_demo and created_at > pg_catalog.clock_timestamp()-interval '1 hour') >= 8 then
    raise exception 'HOURLY_LIMIT' using errcode='P0001';
  end if;
  insert into public.atmosphere_reports(venue_id,submitter_id,crowd_level,social_vibe,energy_level,is_demo)
  values(p_venue_id,p_submitter_id,p_crowd_level,p_social_vibe,p_energy_level,false) returning id into report_id;
  return report_id;
end $$;
revoke all on function public.submit_atmosphere_report(uuid,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.submit_atmosphere_report(uuid,text,text,integer,integer) to service_role;
