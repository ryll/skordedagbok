create or replace function public.import_legacy_harvests(rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  crop_id uuid;
  variety_id uuid;
  location_id uuid;
  inserted_count integer := 0;
  skipped_count integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only the service role may run the legacy import';
  end if;

  for item in select value from jsonb_array_elements(rows) loop
    select id into crop_id from public.crop_types where lower(btrim(name)) = lower(btrim(item->>'cropType'));
    if crop_id is null then
      insert into public.crop_types(name) values (item->>'cropType') returning id into crop_id;
    end if;

    variety_id := null;
    if nullif(item->>'variety', '') is not null then
      select id into variety_id from public.varieties
      where crop_type_id = crop_id and lower(btrim(name)) = lower(btrim(item->>'variety'));
      if variety_id is null then
        insert into public.varieties(crop_type_id, name) values (crop_id, item->>'variety') returning id into variety_id;
      end if;
    end if;

    select id into location_id from public.growing_locations where lower(btrim(name)) = lower(btrim(item->>'location'));
    if location_id is null then
      insert into public.growing_locations(name) values (item->>'location') returning id into location_id;
    end if;

    insert into public.harvests(
      harvest_date, crop_type_id, variety_id, growing_location_id, quantity, weight_grams,
      sowing_date, circumference_cm, length_cm, comment, legacy_source_sheet, legacy_source_row
    ) values (
      (item->>'harvestDate')::date, crop_id, variety_id, location_id,
      (item->>'quantity')::integer, (item->>'weightGrams')::numeric,
      nullif(item->>'sowingDate', '')::date, nullif(item->>'circumferenceCm', '')::numeric,
      nullif(item->>'lengthCm', '')::numeric, nullif(item->>'comment', ''),
      item->>'sourceSheet', (item->>'sourceRow')::integer
    ) on conflict (legacy_source_sheet, legacy_source_row) do nothing;

    if found then inserted_count := inserted_count + 1; else skipped_count := skipped_count + 1; end if;
  end loop;
  return jsonb_build_object('inserted', inserted_count, 'skipped', skipped_count);
end;
$$;

revoke all on function public.import_legacy_harvests(jsonb) from public, anon, authenticated;
grant execute on function public.import_legacy_harvests(jsonb) to service_role;
