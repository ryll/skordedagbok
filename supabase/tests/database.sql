begin;
select plan(21);

insert into public.crop_types(id, name) values ('10000000-0000-4000-8000-000000000001', 'Testgröda A'), ('10000000-0000-4000-8000-000000000002', 'Testgröda B');
insert into public.varieties(id, crop_type_id, name) values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Testsort');
insert into public.growing_locations(id, name) values ('30000000-0000-4000-8000-000000000001', 'Testplats');

set local role anon;
select lives_ok($$select * from public.crop_types$$, 'anonymous reads succeed');
select lives_ok($$select * from public.crop_goals$$, 'anonymous goal reads succeed');
select throws_ok($$insert into public.crop_types(name) values ('Inte tillåten')$$, '42501', null, 'anonymous mutations fail');
select throws_ok($$insert into public.crop_goals(crop_type_id, year, goal_weight_grams) values ('10000000-0000-4000-8000-000000000001', 2026, 1000)$$, '42501', null, 'anonymous goal mutations fail');
select throws_ok($$select public.reassign_variety('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')$$, '42501', null, 'anonymous variety moves fail');

set local role authenticated;
select lives_ok($$insert into public.crop_types(name) values ('Adminskörd')$$, 'authenticated insert succeeds');
select lives_ok($$update public.crop_types set name = 'Adminskörd ändrad' where name = 'Adminskörd'$$, 'authenticated update succeeds');
select lives_ok($$delete from public.crop_types where name = 'Adminskörd ändrad'$$, 'authenticated delete succeeds');
select lives_ok($$insert into public.crop_goals(crop_type_id, year, goal_weight_grams) values ('10000000-0000-4000-8000-000000000001', 2026, 1000)$$, 'authenticated goal insert succeeds');
select lives_ok($$update public.crop_goals set goal_weight_grams = 2000 where crop_type_id = '10000000-0000-4000-8000-000000000001' and year = 2026$$, 'authenticated goal update succeeds');
select lives_ok($$delete from public.crop_goals where crop_type_id = '10000000-0000-4000-8000-000000000001' and year = 2026$$, 'authenticated goal delete succeeds');
select throws_ok($$insert into public.crop_goals(crop_type_id, year, goal_weight_grams) values ('10000000-0000-4000-8000-000000000001', 2026, 0)$$, '23514', null, 'non-positive goal is rejected');
select throws_ok($$insert into public.harvests(harvest_date,crop_type_id,variety_id,growing_location_id,quantity,weight_grams) values ('2026-01-01','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,1)$$, '23503', null, 'incompatible variety is rejected');
select throws_ok($$insert into public.harvests(harvest_date,crop_type_id,growing_location_id,quantity,weight_grams) values ('2026-01-01','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',0,1)$$, '23514', null, 'non-positive quantity is rejected');
select throws_ok($$insert into public.harvests(harvest_date,sowing_date,crop_type_id,growing_location_id,quantity,weight_grams) values ('2026-01-01','2026-01-02','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,1)$$, '23514', null, 'sowing after harvest is rejected');

-- Moving a variety to another crop takes its harvests along and keeps the variety row.
insert into public.harvests(id, harvest_date, crop_type_id, variety_id, growing_location_id, quantity, weight_grams)
values ('40000000-0000-4000-8000-000000000002', '2026-02-01', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 3, 250);

select throws_ok($$select public.reassign_variety('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001')$$, 'GD003', null, 'a variety cannot be moved to the crop it already has');

insert into public.varieties(id, crop_type_id, name) values ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Testsort');
select throws_ok($$select public.reassign_variety('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')$$, 'GD005', null, 'a colliding variety name is rejected');
delete from public.varieties where id = '20000000-0000-4000-8000-000000000002';

select is(
  (select public.reassign_variety('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002') ->> 'movedHarvests'),
  '1', 'the variety move reports the harvests it took along');
select is(
  (select crop_type_id from public.varieties where id = '20000000-0000-4000-8000-000000000001'),
  '10000000-0000-4000-8000-000000000002'::uuid, 'the variety keeps its id under the new crop');
select is(
  (select crop_type_id from public.harvests where id = '40000000-0000-4000-8000-000000000002'),
  '10000000-0000-4000-8000-000000000002'::uuid, 'the harvest follows the variety');
select is(
  (select weight_grams from public.harvests where id = '40000000-0000-4000-8000-000000000002'),
  250::numeric(12,2), 'the harvest keeps its weight');

select * from finish();
rollback;
