begin;
alter table public.venues add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.venues add column if not exists longitude double precision check (longitude between -180 and 180);
update public.venues as v set latitude=p.lat,longitude=p.lon from (values ('V001',-28.132368,153.4901412),('V002',-28.1445026,153.4731954),('V003',-28.1427012,153.4703376),('V004',-28.1374071,153.4739195)) as p(id,lat,lon) where v.id=p.id;
insert into public.venues(id,name,suburb,category,latitude,longitude) values
('V005','Surfers Paradise Beer Garden','Surfers Paradise','Pub',-28.002146,153.429393),
('V006','House of Brews','Surfers Paradise','Bar',-28.0006731,153.4296926),
('V007','Surfers Paradise Surf Life Saving Club','Surfers Paradise','Surf club',-28.0030501,153.4308761),
('V008','Kurrawa Surf Club','Broadbeach','Surf club',-28.0297736,153.4349043),
('V009','The Loose Moose','Broadbeach','Bar',-28.029529,153.4314131),
('V010','The Envy Hotel','Broadbeach','Pub',-28.0289745,153.4321645)
on conflict(id) do update set name=excluded.name,suburb=excluded.suburb,category=excluded.category,latitude=excluded.latitude,longitude=excluded.longitude;
create or replace view public.venue_stats with (security_invoker=true) as
with recent as (
 select * from public.atmosphere_reports where not is_demo and created_at>now()-interval '60 minutes' and created_at<=now()
), totals as (
 select venue_id,count(*) as submission_count,sum(social_vibe) as social_score_total,sum(energy_level) as energy_score_total,max(created_at) as last_report_at from recent group by venue_id
), crowd_votes as (
 select venue_id,crowd_level,count(*) as votes,max(created_at) as newest from recent group by venue_id,crowd_level
), crowd_ranked as (
 select *,row_number() over(partition by venue_id order by votes desc,newest desc,crowd_level) as rank from crowd_votes
)
select v.id as venue_id,v.name,v.suburb,v.category,coalesce(t.submission_count,0) as submission_count,
t.social_score_total,t.energy_score_total,
round(t.social_score_total::numeric/nullif(t.submission_count,0),1) as avg_social_vibe,
round(t.energy_score_total::numeric/nullif(t.submission_count,0),1) as avg_energy_level,
c.crowd_level as current_crowd_level,t.last_report_at,v.latitude,v.longitude
from public.venues v left join totals t on t.venue_id=v.id left join crowd_ranked c on c.venue_id=v.id and c.rank=1 where v.is_active;
revoke all on public.venue_stats from public,anon,authenticated;
grant select on public.venue_stats to service_role;

commit;
