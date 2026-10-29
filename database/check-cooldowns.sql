-- All fixtures, reports and counters roll back. No test scores persist.
begin;
do $$
declare k text:=md5(random()::text)||md5(random()::text); vs text[]; n integer; msg text; detail text; member_id uuid;
begin
select array_agg(id) into vs from (select id from public.venues where is_active order by id limit 2) v;
assert array_length(vs,1)=2,'Need two active pilot venues';
n=public.submit_guest_vibe(k,vs[1],'Lively',7,8); assert n=2;
begin
  perform public.submit_guest_vibe(k,vs[1],'Lively',7,8); raise exception 'Expected same-venue rejection';
exception when raise_exception then
  get stacked diagnostics msg=message_text,detail=pg_exception_detail;
  assert msg='COOLDOWN_SAME_VENUE',msg; assert detail::integer between 1 and 900;
end;
begin
  perform public.submit_guest_vibe(k,vs[2],'Lively',7,8); raise exception 'Expected different-venue rejection';
exception when raise_exception then
  get stacked diagnostics msg=message_text,detail=pg_exception_detail;
  assert msg='COOLDOWN_DIFFERENT_VENUE',msg; assert detail::integer between 1 and 120;
end;
assert (select used=1 from public.guest_trials where guest_key=k),'Rejections must not consume checks';
update public.guest_trials set last_at=clock_timestamp()-interval '120 seconds',venue_times=jsonb_build_object(vs[1],clock_timestamp()-interval '120 seconds') where guest_key=k;
n=public.submit_guest_vibe(k,vs[2],'Lively',7,8); assert n=1,'Different venue allowed after 2 minutes';
begin
  perform public.submit_guest_vibe(k,vs[1],'Lively',7,8); raise exception 'Expected earlier-venue rejection';
exception when raise_exception then
  get stacked diagnostics msg=message_text; assert msg='COOLDOWN_SAME_VENUE',msg;
end;
update public.guest_trials set last_at=clock_timestamp()-interval '120 seconds',venue_times=jsonb_build_object(vs[1],clock_timestamp()-interval '900 seconds',vs[2],clock_timestamp()-interval '120 seconds') where guest_key=k;
n=public.submit_guest_vibe(k,vs[1],'Lively',7,8); assert n=0,'Same venue allowed after 15 minutes';
begin
  perform public.submit_guest_vibe(k,vs[2],'Lively',7,8); raise exception 'Expected guest limit';
exception when raise_exception then
  get stacked diagnostics msg=message_text; assert msg='GUEST_LIMIT',msg;
end;
-- Use an existing member only if they have no recent live reports; all test reports roll back.
select u.id into member_id from auth.users u where not exists(select 1 from public.atmosphere_reports r where r.submitter_id=u.id and not r.is_demo and r.created_at>clock_timestamp()-interval '1 hour') limit 1;
if member_id is not null then
  perform public.submit_atmosphere_report(member_id,vs[1],'Lively',7,8);
  begin
    perform public.submit_atmosphere_report(member_id,vs[1],'Lively',7,8); raise exception 'Expected member same-venue rejection';
  exception when raise_exception then
    get stacked diagnostics msg=message_text; assert msg='COOLDOWN_SAME_VENUE',msg;
  end;
  begin
    perform public.submit_atmosphere_report(member_id,vs[2],'Lively',7,8); raise exception 'Expected member different-venue rejection';
  exception when raise_exception then
    get stacked diagnostics msg=message_text; assert msg='COOLDOWN_DIFFERENT_VENUE',msg;
  end;
end if;
end $$;
rollback;
select 'PASS: guest cooldowns, 2/15 minute boundaries, A-B-A history, quota preservation; member rules when an idle account is available; all fixtures rolled back' as result;
