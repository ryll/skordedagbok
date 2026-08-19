create table public.crop_goals (
  crop_type_id uuid not null references public.crop_types(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  goal_weight_grams numeric(12, 2) not null check (goal_weight_grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (crop_type_id, year)
);

create trigger crop_goals_updated_at before update on public.crop_goals
for each row execute function public.set_updated_at();

alter table public.crop_goals enable row level security;

create policy "Public read" on public.crop_goals
for select to anon, authenticated using (true);
create policy "Admin insert" on public.crop_goals
for insert to authenticated with check (true);
create policy "Admin update" on public.crop_goals
for update to authenticated using (true) with check (true);
create policy "Admin delete" on public.crop_goals
for delete to authenticated using (true);

grant select on public.crop_goals to anon, authenticated;
grant insert, update, delete on public.crop_goals to authenticated;
