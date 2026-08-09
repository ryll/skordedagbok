create extension if not exists pgcrypto;

create table public.crop_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index crop_types_name_ci_key on public.crop_types (lower(btrim(name)));

create table public.varieties (
  id uuid primary key default gen_random_uuid(),
  crop_type_id uuid not null references public.crop_types(id),
  name text not null check (length(btrim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, crop_type_id)
);
create unique index varieties_crop_name_ci_key on public.varieties (crop_type_id, lower(btrim(name)));

create table public.growing_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index growing_locations_name_ci_key on public.growing_locations (lower(btrim(name)));

create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  harvest_date date not null,
  crop_type_id uuid not null references public.crop_types(id),
  variety_id uuid,
  growing_location_id uuid not null references public.growing_locations(id),
  quantity integer not null check (quantity > 0),
  weight_grams numeric(12, 2) not null check (weight_grams > 0),
  sowing_date date,
  circumference_cm numeric(10, 2) check (circumference_cm is null or circumference_cm > 0),
  length_cm numeric(10, 2) check (length_cm is null or length_cm > 0),
  comment text,
  legacy_source_sheet text,
  legacy_source_row integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint harvests_sowing_before_harvest check (sowing_date is null or sowing_date <= harvest_date),
  constraint harvests_compatible_variety foreign key (variety_id, crop_type_id)
    references public.varieties(id, crop_type_id),
  constraint harvests_legacy_source_unique unique (legacy_source_sheet, legacy_source_row)
);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger crop_types_updated_at before update on public.crop_types
for each row execute function public.set_updated_at();
create trigger varieties_updated_at before update on public.varieties
for each row execute function public.set_updated_at();
create trigger growing_locations_updated_at before update on public.growing_locations
for each row execute function public.set_updated_at();
create trigger harvests_updated_at before update on public.harvests
for each row execute function public.set_updated_at();

alter table public.crop_types enable row level security;
alter table public.varieties enable row level security;
alter table public.growing_locations enable row level security;
alter table public.harvests enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['crop_types', 'varieties', 'growing_locations', 'harvests'] loop
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', table_name);
    execute format('create policy "Admin insert" on public.%I for insert to authenticated with check (true)', table_name);
    execute format('create policy "Admin update" on public.%I for update to authenticated using (true) with check (true)', table_name);
    execute format('create policy "Admin delete" on public.%I for delete to authenticated using (true)', table_name);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.crop_types, public.varieties, public.growing_locations, public.harvests to anon, authenticated;
grant insert, update, delete on public.crop_types, public.varieties, public.growing_locations, public.harvests to authenticated;
