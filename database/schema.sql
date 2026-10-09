create table public.venues (
 id text primary key,
 name text not null check (length(name) between 1 and 150),
 suburb text not null,
 category text not null,
 is_active boolean not null default true,
 details_verified boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.venues enable row level security;
revoke all on public.venues from public, anon, authenticated;
grant select on public.venues to anon, authenticated;
grant all on public.venues to service_role;
create policy "Read active venue catalogue" on public.venues for select to anon, authenticated using (is_active);
create table public.atmosphere_reports (
 id uuid primary key default gen_random_uuid(),
 venue_id text not null references public.venues(id),
 submitter_id uuid references auth.users(id) on delete cascade,
 crowd_level text not null check (crowd_level in ('Quiet','Lively','Packed')),
 social_vibe smallint not null check (social_vibe between 1 and 10),
 energy_level smallint not null check (energy_level between 1 and 10),
 is_demo boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.atmosphere_reports enable row level security;
revoke all on public.atmosphere_reports from public, anon, authenticated;
grant select,insert,delete on public.atmosphere_reports to service_role;
create index reports_venue_time_idx on public.atmosphere_reports(venue_id,created_at desc);
create index reports_submitter_time_idx on public.atmosphere_reports(submitter_id,created_at desc) where submitter_id is not null;
create view public.venue_stats with (security_invoker=true) as
with recent as (
 select * from public.atmosphere_reports
 where not is_demo and created_at > now()-interval '60 minutes' and created_at<=now()
), totals as (
 select venue_id,count(*) as submission_count,sum(social_vibe) as social_score_total,sum(energy_level) as energy_score_total,max(created_at) as last_report_at
 from recent group by venue_id
), crowd_votes as (
 select venue_id,crowd_level,count(*) as votes,max(created_at) as newest
 from recent group by venue_id,crowd_level
), crowd_ranked as (
 select *,row_number() over(partition by venue_id order by votes desc,newest desc,crowd_level) as rank from crowd_votes
)
select v.id as venue_id,v.name,v.suburb,v.category,
 coalesce(t.submission_count,0) as submission_count,
 case when t.submission_count>=3 then t.social_score_total end as social_score_total,
 case when t.submission_count>=3 then t.energy_score_total end as energy_score_total,
 case when t.submission_count>=3 then round(t.social_score_total::numeric/t.submission_count,1) end as avg_social_vibe,
 case when t.submission_count>=3 then round(t.energy_score_total::numeric/t.submission_count,1) end as avg_energy_level,
 case when t.submission_count>=3 then c.crowd_level end as current_crowd_level,
 case when t.submission_count>=3 then t.last_report_at end as last_report_at
from public.venues v left join totals t on t.venue_id=v.id
left join crowd_ranked c on c.venue_id=v.id and c.rank=1 where v.is_active;
revoke all on public.venue_stats from public,anon,authenticated;
grant select on public.venue_stats to service_role;
insert into public.venues(id,name,suburb,category) values
 ('V001','Currumbin Beach Surf Club','Currumbin','Surf club'),
 ('V002','The Dust Temple','Currumbin Waters','Arts & social'),
 ('V003','Balter Brewing Company','Currumbin Waters','Brewery'),
 ('V004','Currumbin RSL','Currumbin Waters','Club');
comment on table public.atmosphere_reports is 'Private submissions. No browser access; use a validated server endpoint. Do not expose raw reports through Realtime.';
comment on view public.venue_stats is 'Server-only aggregate snapshot. Excludes demo and expired reports; requires 3 reports for scores.';