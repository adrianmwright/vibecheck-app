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
c.crowd_level as current_crowd_level,t.last_report_at
from public.venues v left join totals t on t.venue_id=v.id left join crowd_ranked c on c.venue_id=v.id and c.rank=1 where v.is_active;
revoke all on public.venue_stats from public,anon,authenticated;
grant select on public.venue_stats to service_role;