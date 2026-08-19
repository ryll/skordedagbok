begin;
select plan(14);

insert into public.crop_types(id, name) values ('10000000-0000-4000-8000-000000000001', 'Testgröda A'), ('10000000-0000-4000-8000-000000000002', 'Testgröda B');
insert into public.varieties(id, crop_type_id, name) values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Testsort');
insert into public.growing_locations(id, name) values ('30000000-0000-4000-8000-000000000001', 'Testplats');

set local role anon;
select lives_ok($$select * from public.crop_types$$, 'anonymous reads succeed');
select lives_ok($$select * from public.crop_goals$$, 'anonymous goal reads succeed');
select throws_ok($$insert into public.crop_types(name) values ('Inte tillåten')$$, '42501', null, 'anonymous mutations fail');
select throws_ok($$insert into public.crop_goals(crop_type_id, year, goal_weight_grams) values ('10000000-0000-4000-8000-000000000001', 2026, 1000)$$, '42501', null, 'anonymous goal mutations fail');

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

select * from finish();
rollback;
