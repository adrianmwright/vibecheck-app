create table if not exists public.guest_trials (guest_key text primary key check(length(guest_key)=64), used smallint not null default 0 check(used between 0 and 3), last_venue text, last_at timestamptz);
alter table public.guest_trials enable row level security;
revoke all on public.guest_trials from public,anon,authenticated;
grant select,insert,update on public.guest_trials to service_role;
create or replace function public.submit_guest_vibe(p_guest_key text,p_venue_id text,p_crowd_level text,p_social_vibe integer,p_energy_level integer) returns integer language plpgsql security invoker set search_path='' as $$
declare trial public.guest_trials;
begin
if p_guest_key is null or p_guest_key !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_GUEST'; end if;
if p_crowd_level is null or p_crowd_level not in ('Quiet','Lively','Packed') or p_social_vibe is null or p_social_vibe not between 1 and 10 or p_energy_level is null or p_energy_level not between 1 and 10 then raise exception 'INVALID_REPORT'; end if;
if not exists(select 1 from public.venues where id=p_venue_id and is_active) then raise exception 'VENUE_UNAVAILABLE'; end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('guest:'||p_guest_key,0));
insert into public.guest_trials(guest_key) values(p_guest_key) on conflict do nothing;
select * into trial from public.guest_trials where guest_key=p_guest_key for update;
if trial.used>=3 then raise exception 'GUEST_LIMIT'; end if;
if trial.last_at > pg_catalog.clock_timestamp()-interval '15 minutes' then raise exception 'COOLDOWN'; end if;
insert into public.atmosphere_reports(venue_id,crowd_level,social_vibe,energy_level,is_demo) values(p_venue_id,p_crowd_level,p_social_vibe,p_energy_level,false);
update public.guest_trials set used=used+1,last_venue=p_venue_id,last_at=pg_catalog.clock_timestamp() where guest_key=p_guest_key;
return 2-trial.used;
end $$;
revoke all on function public.submit_guest_vibe(text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.submit_guest_vibe(text,text,text,integer,integer) to service_role;