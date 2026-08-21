-- Moves a variety from one crop to another, taking its harvests along.
-- harvests_compatible_variety ties a harvest to the pair (variety_id, crop_type_id),
-- so the variety and its harvests have to change crop within the same statement pair.
-- Making the constraint deferrable lets both updates happen before it is checked.
alter table public.harvests drop constraint if exists harvests_compatible_variety;
alter table public.harvests add constraint harvests_compatible_variety
  foreign key (variety_id, crop_type_id) references public.varieties(id, crop_type_id)
  deferrable initially immediate;

create or replace function public.reassign_variety(source_variety_id uuid, target_crop_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  variety_name text;
  current_crop_id uuid;
  moved_count integer;
begin
  select name, crop_type_id into variety_name, current_crop_id
  from public.varieties where id = source_variety_id for update;
  if variety_name is null then
    raise exception 'The variety does not exist' using errcode = 'GD003';
  end if;

  if current_crop_id = target_crop_id then
    raise exception 'The variety already belongs to that crop' using errcode = 'GD003';
  end if;

  perform 1 from public.crop_types where id = target_crop_id for update;
  if not found then
    raise exception 'The receiving crop does not exist' using errcode = 'GD003';
  end if;

  perform 1 from public.varieties
  where crop_type_id = target_crop_id and lower(btrim(name)) = lower(btrim(variety_name));
  if found then
    raise exception 'The receiving crop already has a variety with that name'
      using errcode = 'GD005';
  end if;

  set constraints public.harvests_compatible_variety deferred;

  update public.varieties set crop_type_id = target_crop_id where id = source_variety_id;

  update public.harvests set crop_type_id = target_crop_id where variety_id = source_variety_id;
  get diagnostics moved_count = row_count;

  return jsonb_build_object('movedHarvests', moved_count);
end;
$$;

revoke all on function public.reassign_variety(uuid, uuid) from public, anon;
grant execute on function public.reassign_variety(uuid, uuid) to authenticated;
