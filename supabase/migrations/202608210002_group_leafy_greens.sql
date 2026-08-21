-- One-time grouping of the standalone leaf crops under a shared crop, matching how
-- herbs already sit under Ört. The harvests only change which crop and variety they
-- point at, so the recorded weights and the number of harvests stay the same.
do $$
declare
  target_id uuid;
  leaf_crop record;
  new_variety_id uuid;
  weight_before numeric;
  weight_after numeric;
  rows_before integer;
  rows_after integer;
begin
  select coalesce(sum(weight_grams), 0), count(*) into weight_before, rows_before from public.harvests;

  select id into target_id from public.crop_types where lower(btrim(name)) = 'gröna blad';
  if target_id is null then
    insert into public.crop_types(name) values ('Gröna blad') returning id into target_id;
  end if;

  for leaf_crop in
    select id, name from public.crop_types
    where lower(btrim(name)) in ('isört', 'rucola', 'ängssyra')
    order by name
  loop
    -- A harvest has a single variety slot, so a crop that already has varieties
    -- cannot become one itself.
    if exists (select 1 from public.varieties where crop_type_id = leaf_crop.id) then
      raise exception 'The crop % has varieties of its own and was not grouped', leaf_crop.name;
    end if;
    if exists (select 1 from public.crop_goals where crop_type_id = leaf_crop.id) then
      raise exception 'The crop % has goals and was not grouped', leaf_crop.name;
    end if;

    select id into new_variety_id from public.varieties
    where crop_type_id = target_id and lower(btrim(name)) = lower(btrim(leaf_crop.name));
    if new_variety_id is null then
      insert into public.varieties(crop_type_id, name) values (target_id, leaf_crop.name)
      returning id into new_variety_id;
    end if;

    -- Both columns change together so that (variety_id, crop_type_id) stays a valid
    -- pair, which is what harvests_compatible_variety requires.
    update public.harvests set crop_type_id = target_id, variety_id = new_variety_id
    where crop_type_id = leaf_crop.id;

    delete from public.crop_types where id = leaf_crop.id;
  end loop;

  select coalesce(sum(weight_grams), 0), count(*) into weight_after, rows_after from public.harvests;
  if weight_before <> weight_after or rows_before <> rows_after then
    raise exception 'The grouping changed the harvest totals: % g / % rows became % g / % rows',
      weight_before, rows_before, weight_after, rows_after;
  end if;
end $$;
