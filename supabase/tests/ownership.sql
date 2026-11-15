-- Transaction-scoped ownership checks. No test users or profiles survive the rollback.
begin;
do $$
declare
  alice uuid := gen_random_uuid();
  bob uuid := gen_random_uuid();
  alice_profile uuid := gen_random_uuid();
  bob_profile uuid := gen_random_uuid();
  spoof uuid := gen_random_uuid();
  sample jsonb := jsonb_build_object('name','Security test','date','1990-05-15','time','14:30:00','place','Jaipur','latitude',26.91962,'longitude',75.78781,'timeZone','Asia/Kolkata','certainty','exact','disambiguation','reject','notes','','createdAt','2026-11-15T00:00:00Z','updatedAt','2026-11-15T00:00:00Z');
  n integer;
  rejected boolean;
begin
  insert into auth.users(id,aud,role,email) values (alice,'authenticated','authenticated','kanastro-test-' || alice::text || '@example.invalid'), (bob,'authenticated','authenticated','kanastro-test-' || bob::text || '@example.invalid');
  insert into public.kundli_profiles(id,owner_id,record) values (alice_profile,alice,sample || jsonb_build_object('id',alice_profile)), (bob_profile,bob,sample || jsonb_build_object('id',bob_profile));
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub',alice::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',alice,'role','authenticated')::text,true);
  select count(*) into n from public.kundli_profiles where id in (alice_profile,bob_profile);
  if n <> 1 then raise exception 'Owner read isolation failed'; end if;
  update public.kundli_profiles set record=record || '{"name":"Own edit"}'::jsonb where id=alice_profile;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Owner update failed'; end if;
  update public.kundli_profiles set record=record || '{"name":"Cross-account edit"}'::jsonb where id=bob_profile;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cross-account update was allowed'; end if;
  delete from public.kundli_profiles where id=bob_profile;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cross-account delete was allowed'; end if;
  rejected := false;
  begin
    insert into public.kundli_profiles(id,owner_id,record) values (spoof,bob,sample || jsonb_build_object('id',spoof));
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Owner spoofing insert was allowed'; end if;
  rejected := false;
  begin
    update public.kundli_profiles set owner_id=bob where id=alice_profile;
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Ownership reassignment was allowed'; end if;
  insert into public.account_preferences(owner_id,settings) values (alice,'{"ayanamsa":1,"nodes":"mean","karakas":7,"yearDays":365.25636,"d60":"from-sign"}');
  rejected := false;
  begin
    insert into public.account_preferences(owner_id,settings) values (bob,'{}');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Cross-account settings insert was allowed'; end if;
  perform set_config('request.jwt.claim.sub',bob::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',bob,'role','authenticated')::text,true);
  select count(*) into n from public.kundli_profiles where id in (alice_profile,bob_profile);
  if n <> 1 then raise exception 'Second account read isolation failed'; end if;
  select count(*) into n from public.account_preferences where owner_id=alice;
  if n <> 0 then raise exception 'Cross-account settings read was allowed'; end if;
  execute 'set local role anon';
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{}',true);
  rejected := false;
  begin
    perform 1 from public.kundli_profiles limit 1;
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Anonymous profile access was allowed'; end if;
  execute 'reset role';
end $$;
select 'PASS: owner reads/writes, cross-account isolation, spoofing rejection, anonymous denial' as result;
rollback;
