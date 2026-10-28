-- Live guest history is bounded by the three-check allowance. Keep it private.
alter table public.guest_trials add column if not exists venue_times jsonb not null default '{}'::jsonb;
update public.guest_trials set venue_times=jsonb_build_object(last_venue,last_at)
where last_venue is not null and last_at is not null and venue_times='{}'::jsonb;

create or replace function public.submit_guest_vibe(p_guest_key text,p_venue_id text,p_crowd_level text,p_social_vibe integer,p_energy_level integer) returns integer language plpgsql security invoker set search_path='' as $$
declare trial public.guest_trials; checked_at timestamptz; same_at timestamptz; wait_seconds integer;
begin
if p_guest_key is null or p_guest_key !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_GUEST'; end if;
if p_crowd_level is null or p_crowd_level not in ('Quiet','Lively','Packed') or p_social_vibe is null or p_social_vibe not between 1 and 10 or p_energy_level is null or p_energy_level not between 1 and 10 then raise exception 'INVALID_REPORT'; end if;
if not exists(select 1 from public.venues where id=p_venue_id and is_active) then raise exception 'VENUE_UNAVAILABLE'; end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('guest:'||p_guest_key,0));
insert into public.guest_trials(guest_key) values(p_guest_key) on conflict do nothing;
select * into trial from public.guest_trials where guest_key=p_guest_key for update;
checked_at=pg_catalog.clock_timestamp();
if trial.used>=3 then raise exception 'GUEST_LIMIT'; end if;
same_at=(trial.venue_times->>p_venue_id)::timestamptz;
if same_at > checked_at-interval '15 minutes' then
  wait_seconds=ceil(extract(epoch from same_at+interval '15 minutes'-checked_at));
  raise exception 'COOLDOWN_SAME_VENUE' using detail=wait_seconds::text;
end if;
if trial.last_at > checked_at-interval '2 minutes' then
  wait_seconds=ceil(extract(epoch from trial.last_at+interval '2 minutes'-checked_at));
  raise exception 'COOLDOWN_DIFFERENT_VENUE' using detail=wait_seconds::text;
end if;
insert into public.atmosphere_reports(venue_id,crowd_level,social_vibe,energy_level,is_demo) values(p_venue_id,p_crowd_level,p_social_vibe,p_energy_level,false);
update public.guest_trials set used=used+1,last_venue=p_venue_id,last_at=checked_at,
venue_times=venue_times||jsonb_build_object(p_venue_id,checked_at) where guest_key=p_guest_key;
return 2-trial.used;
end $$;
revoke all on function public.submit_guest_vibe(text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.submit_guest_vibe(text,text,text,integer,integer) to service_role;

-- Registered users follow the same time rules; retain the hourly safety limit.
create or replace function public.submit_atmosphere_report(p_submitter_id uuid,p_venue_id text,p_crowd_level text,p_social_vibe integer,p_energy_level integer) returns uuid language plpgsql security invoker set search_path='' as $$
declare report_id uuid; checked_at timestamptz; same_at timestamptz; latest_at timestamptz; wait_seconds integer;
begin
if p_submitter_id is null then raise exception 'SIGN_IN_REQUIRED'; end if;
if p_crowd_level is null or p_crowd_level not in ('Quiet','Lively','Packed') or p_social_vibe is null or p_social_vibe not between 1 and 10 or p_energy_level is null or p_energy_level not between 1 and 10 then raise exception 'INVALID_REPORT'; end if;
if not exists(select 1 from public.venues where id=p_venue_id and is_active) then raise exception 'VENUE_UNAVAILABLE'; end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_submitter_id::text,0));
checked_at=pg_catalog.clock_timestamp();
select max(created_at) filter(where venue_id=p_venue_id),max(created_at) into same_at,latest_at
from public.atmosphere_reports where submitter_id=p_submitter_id and not is_demo and created_at>checked_at-interval '15 minutes';
if same_at > checked_at-interval '15 minutes' then
  wait_seconds=ceil(extract(epoch from same_at+interval '15 minutes'-checked_at));
  raise exception 'COOLDOWN_SAME_VENUE' using detail=wait_seconds::text;
end if;
if latest_at > checked_at-interval '2 minutes' then
  wait_seconds=ceil(extract(epoch from latest_at+interval '2 minutes'-checked_at));
  raise exception 'COOLDOWN_DIFFERENT_VENUE' using detail=wait_seconds::text;
end if;
if (select count(*) from public.atmosphere_reports where submitter_id=p_submitter_id and not is_demo and created_at>checked_at-interval '1 hour')>=8 then raise exception 'HOURLY_LIMIT'; end if;
insert into public.atmosphere_reports(venue_id,submitter_id,crowd_level,social_vibe,energy_level,is_demo) values(p_venue_id,p_submitter_id,p_crowd_level,p_social_vibe,p_energy_level,false) returning id into report_id;
return report_id;
end $$;
revoke all on function public.submit_atmosphere_report(uuid,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.submit_atmosphere_report(uuid,text,text,integer,integer) to service_role;
